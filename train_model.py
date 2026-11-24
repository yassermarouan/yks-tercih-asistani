import os
import sys
import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.metrics import mean_absolute_error
import joblib

# Ensure UTF-8 output on Windows console
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def build_longitudinal_dataset(csv_path: str):
    """
    Builds clean chronological pairs (2023->2024 for training, 2024->2025 for testing)
    with 4 predictive features:
      1. previous_closing_rank
      2. published_quota
      3. quota_change_pct
      4. rank_momentum_ratio
    """
    df = pd.read_csv(csv_path, dtype={"program_code": str}, encoding="utf-8-sig")
    
    # Standardize score types
    score_types = ["SAY", "EA", "SÖZ", "DİL"]
    datasets_by_score_type = {}
    
    for st in score_types:
        st_df = df[df["score_type"] == st].copy()
        
        ranks = st_df.pivot(index="program_code", columns="year", values="closing_rank")
        quotas = st_df.pivot(index="program_code", columns="year", values="published_quota")
        meta = st_df.drop_duplicates(subset=["program_code"])[
            ["program_code", "university_name", "program_name", "score_type"]
        ].set_index("program_code")
        
        # Ensure all columns exist
        for yr in [2023, 2024, 2025]:
            if yr not in ranks.columns:
                ranks[yr] = np.nan
            if yr not in quotas.columns:
                quotas[yr] = np.nan
                
        # Train mask: Programs active in 2023 & 2024
        train_mask = (
            ranks[2024].notna()
            & (ranks[2024] > 0)
            & ranks[2023].notna()
            & (ranks[2023] > 0)
            & quotas[2024].notna()
            & (quotas[2024] > 0)
            & quotas[2023].notna()
            & (quotas[2023] > 0)
        )
        
        # Test mask: Programs active in 2024 & 2025
        test_mask = (
            ranks[2025].notna()
            & (ranks[2025] > 0)
            & ranks[2024].notna()
            & (ranks[2024] > 0)
            & quotas[2025].notna()
            & (quotas[2025] > 0)
            & quotas[2024].notna()
            & (quotas[2024] > 0)
        )
        
        # Train features (Predicting 2024 closing_rank from 2023 data)
        # Apply Laplace damping factor k=10 to avoid small quota division distortions (e.g. 2->4 is +16.7% instead of +100%)
        train_quota_change = (
            (quotas.loc[train_mask, 2024] - quotas.loc[train_mask, 2023])
            / (quotas.loc[train_mask, 2023] + 10)
        ) * 100
        
        train_X = pd.DataFrame({
            "previous_closing_rank": ranks.loc[train_mask, 2023].astype(float),
            "published_quota": quotas.loc[train_mask, 2024].astype(float),
            "quota_change_pct": train_quota_change.clip(-80, 200).astype(float),
            "rank_momentum_ratio": 1.0,  # Single-year baseline
        }, index=ranks.loc[train_mask].index)
        train_y = ranks.loc[train_mask, 2024].astype(float)
        
        # Test features (Predicting 2025 closing_rank from 2024 data, with 2023 momentum)
        test_quota_change = (
            (quotas.loc[test_mask, 2025] - quotas.loc[test_mask, 2024])
            / (quotas.loc[test_mask, 2024] + 10)
        ) * 100
        
        momentum_25 = np.where(
            ranks.loc[test_mask, 2023].notna() & (ranks.loc[test_mask, 2023] > 0),
            ranks.loc[test_mask, 2024] / ranks.loc[test_mask, 2023],
            1.0
        )
        momentum_25 = np.clip(momentum_25, 0.5, 2.0)
        
        test_X = pd.DataFrame({
            "previous_closing_rank": ranks.loc[test_mask, 2024].astype(float),
            "published_quota": quotas.loc[test_mask, 2025].astype(float),
            "quota_change_pct": test_quota_change.clip(-80, 200).astype(float),
            "rank_momentum_ratio": momentum_25.astype(float),
        }, index=ranks.loc[test_mask].index)
        test_y = ranks.loc[test_mask, 2025].astype(float)
        
        meta_test = meta.reindex(test_X.index)
        
        datasets_by_score_type[st] = {
            "train_X": train_X,
            "train_y": train_y,
            "test_X": test_X,
            "test_y": test_y,
            "meta_test": meta_test,
        }
        
    return datasets_by_score_type


def main():
    csv_path = "admissions_history_readable.csv"
    model_dir = "models"
    results_dir = "results"
    output_model_path = os.path.join(model_dir, "yks_lgbm_models.joblib")
    output_predictions_path = os.path.join(results_dir, "test_predictions_2025.csv")
    
    os.makedirs(model_dir, exist_ok=True)
    os.makedirs(results_dir, exist_ok=True)

    print("=" * 70)
    print("YKS LightGBM Multi-Score-Type & Quantile Predictor Training")
    print("Supported: SAY, EA, SÖZ, DİL | Features: Rank, Quota, Delta%, Momentum")
    print("=" * 70)

    datasets = build_longitudinal_dataset(csv_path)
    
    models_bundle = {
        "score_types": {},
        "feature_names": ["previous_closing_rank", "published_quota", "quota_change_pct", "rank_momentum_ratio"],
        "feature_labels": {
            "previous_closing_rank": "Son Yıl Taban Sıralaması",
            "published_quota": "Kontenjan Büyüklüğü",
            "quota_change_pct": "Kontenjan Değişim Yüzdesi",
            "rank_momentum_ratio": "Sıralama Değişim İvmesi (Trend)",
        },
        "evaluation_summary": {},
    }

    all_test_results = []

    for st, d in datasets.items():
        train_X, train_y = d["train_X"], d["train_y"]
        test_X, test_y = d["test_X"], d["test_y"]
        meta_test = d["meta_test"]
        
        print(f"\n--- Training LightGBM Models for [{st}] ---")
        print(f"Train samples: {len(train_X):,} | Test samples: {len(test_X):,}")
        
        # 1. Point prediction model (L1 regression for robust median / outlier handling)
        m_point = lgb.LGBMRegressor(
            objective="regression_l1",
            n_estimators=180,
            learning_rate=0.03,
            num_leaves=35,
            min_child_samples=10,
            random_state=42,
            verbose=-1,
        )
        m_point.fit(train_X, train_y)
        preds_point = m_point.predict(test_X)
        
        # 2. Lower bound quantile model (10th percentile)
        m_lower = lgb.LGBMRegressor(
            objective="quantile",
            alpha=0.10,
            n_estimators=120,
            learning_rate=0.04,
            num_leaves=25,
            min_child_samples=15,
            random_state=42,
            verbose=-1,
        )
        m_lower.fit(train_X, train_y)
        preds_lower = m_lower.predict(test_X)
        
        # 3. Upper bound quantile model (90th percentile)
        m_upper = lgb.LGBMRegressor(
            objective="quantile",
            alpha=0.90,
            n_estimators=120,
            learning_rate=0.04,
            num_leaves=25,
            min_child_samples=15,
            random_state=42,
            verbose=-1,
        )
        m_upper.fit(train_X, train_y)
        preds_upper = m_upper.predict(test_X)
        
        # Evaluation
        baseline_preds = test_X["previous_closing_rank"].values
        mae_point = mean_absolute_error(test_y, preds_point)
        mae_baseline = mean_absolute_error(test_y, baseline_preds)
        correlation = float(np.corrcoef(test_y, preds_point)[0, 1])
        
        # Ensure interval sanity: lower <= point <= upper
        final_lower = np.minimum(preds_lower, preds_point * 0.95)
        final_upper = np.maximum(preds_upper, preds_point * 1.05)
        
        # Coverage rate: what percentage of actual values fall within the [lower, upper] interval
        coverage = np.mean((test_y >= final_lower) & (test_y <= final_upper)) * 100
        
        print(f"LightGBM MAE:    {mae_point:,.1f} ranks")
        print(f"Baseline MAE:    {mae_baseline:,.1f} ranks")
        if mae_point < mae_baseline:
            print(f"Improvement:     -{mae_baseline - mae_point:,.1f} ranks (LightGBM is better!)")
        else:
            print(f"Baseline Diff:   +{mae_point - mae_baseline:,.1f} ranks")
        print(f"Correlation (r): {correlation:.4f}")
        print(f"80% Interval Coverage: %{coverage:.1f}")
        
        # Save to bundle
        models_bundle["score_types"][st] = {
            "point_model": m_point,
            "lower_model": m_lower,
            "upper_model": m_upper,
            "train_count": len(train_X),
            "test_count": len(test_X),
            "mae_model": float(mae_point),
            "mae_baseline": float(mae_baseline),
            "correlation": correlation,
            "interval_coverage_pct": float(coverage),
        }
        
        models_bundle["evaluation_summary"][st] = {
            "mae_model": float(mae_point),
            "mae_baseline": float(mae_baseline),
            "correlation": correlation,
            "test_rows": len(test_X),
            "coverage_pct": float(coverage),
        }
        
        # Append to prediction results
        sub_res = pd.DataFrame({
            "program_code": test_X.index.values,
            "score_type": st,
            "university_name": meta_test["university_name"].values,
            "program_name": meta_test["program_name"].values,
            "previous_closing_rank": test_X["previous_closing_rank"].values,
            "published_quota": test_X["published_quota"].values,
            "quota_change_pct": test_X["quota_change_pct"].values,
            "rank_momentum_ratio": test_X["rank_momentum_ratio"].values,
            "actual_closing_rank": test_y.values,
            "predicted_closing_rank": preds_point,
            "predicted_lower_bound": final_lower,
            "predicted_upper_bound": final_upper,
            "baseline_prediction": baseline_preds,
            "model_absolute_error": np.abs(test_y.values - preds_point),
            "baseline_absolute_error": np.abs(test_y.values - baseline_preds),
        })
        all_test_results.append(sub_res)

    # Save fitted models bundle
    print("\n" + "=" * 70)
    print(f"Saving LightGBM bundle to: '{output_model_path}'...")
    joblib.dump(models_bundle, output_model_path)
    print("Models bundle saved successfully.")

    # Save overall predictions
    combined_results = pd.concat(all_test_results, ignore_index=True)
    combined_results.to_csv(output_predictions_path, index=False, encoding="utf-8-sig")
    print(f"Saved test predictions to: '{output_predictions_path}' ({len(combined_results):,} rows)")
    
    # Overall summary
    total_model_mae = combined_results["model_absolute_error"].mean()
    total_base_mae = combined_results["baseline_absolute_error"].mean()
    total_corr = combined_results["actual_closing_rank"].corr(combined_results["predicted_closing_rank"])
    
    print("\n" + "=" * 70)
    print("OVERALL MULTI-SCORE-TYPE EVALUATION SUMMARY:")
    print(f"Total Test Programs: {len(combined_results):,}")
    print(f"Overall LightGBM MAE: {total_model_mae:,.1f}")
    print(f"Overall Baseline MAE: {total_base_mae:,.1f}")
    print(f"Overall Correlation:  {total_corr:.4f}")
    print("=" * 70)


if __name__ == "__main__":
    main()
