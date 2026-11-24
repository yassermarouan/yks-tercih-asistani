import argparse
import json
import os
import sys
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import shap

# Ensure UTF-8 output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def parse_args():
    parser = argparse.ArgumentParser(
        description="Explain 2025 YKS closing-rank prediction using SHAP TreeExplainer."
    )
    parser.add_argument(
        "--program-code",
        type=str,
        default=None,
        help="Program code to explain. If omitted, uses the first row of test predictions.",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    model_path = os.path.join("models", "random_forest_yks.joblib")
    csv_path = os.path.join("results", "test_predictions_2025.csv")
    waterfall_path = os.path.join("results", "shap_waterfall_2025.png")
    json_path = os.path.join("results", "shap_explanation_2025.json")

    print("=" * 60)
    print("SHAP TreeExplainer Prediction Explanation (2025 SAY)")
    print("=" * 60)

    # 1. Load model and test predictions
    if not os.path.exists(model_path):
        print(f"Error: Model file '{model_path}' not found. Run train_model.py first.")
        sys.exit(1)
    if not os.path.exists(csv_path):
        print(f"Error: Test predictions file '{csv_path}' not found. Run train_model.py first.")
        sys.exit(1)

    print(f"\n[1/5] Loading model from '{model_path}' and predictions from '{csv_path}'...")
    model = joblib.load(model_path)
    df_preds = pd.read_csv(csv_path, dtype={"program_code": str}, encoding="utf-8-sig")

    # 2. Select program
    if args.program_code:
        matching = df_preds[df_preds["program_code"] == str(args.program_code).strip()]
        if matching.empty:
            print(f"Error: Program code '{args.program_code}' not found in 2025 test set.")
            sys.exit(1)
        row = matching.iloc[0]
        print(f"Selected Program Code (from argument): {row['program_code']}")
        print(f"University: {row['university_name']}")
        print(f"Program:    {row['program_name']}")
    else:
        row = df_preds.iloc[0]
        print("No --program-code specified. Selecting first test row:")
        print(f"Selected Program Code: {row['program_code']}")
        print(f"University:            {row['university_name']}")
        print(f"Program:               {row['program_name']}")

    # 3. Recompute prediction using features in exact order
    print("\n[2/5] Recomputing model prediction...")
    feature_cols = ["previous_closing_rank", "published_quota"]
    prev_rank_val = float(row["previous_closing_rank"])
    quota_val = float(row["published_quota"])

    X_sample = pd.DataFrame(
        [[prev_rank_val, quota_val]],
        columns=feature_cols,
    )

    recomputed_pred = float(model.predict(X_sample)[0])
    saved_pred = float(row["predicted_closing_rank"])
    pred_diff = abs(recomputed_pred - saved_pred)

    print(f"  Input 'previous_closing_rank': {prev_rank_val:,.1f}")
    print(f"  Input 'published_quota':        {quota_val:,.1f}")
    print(f"  Recomputed Model Prediction:    {recomputed_pred:,.4f}")
    print(f"  Saved CSV Prediction:           {saved_pred:,.4f}")
    print(f"  Absolute Difference:            {pred_diff:.2e}")

    # Check precision agreement (within rounding / float precision)
    if np.isclose(recomputed_pred, saved_pred, atol=1e-3, rtol=1e-5):
        print("  ✓ Check PASSED: Recomputed prediction agrees with saved CSV prediction.")
    else:
        print("  ✗ Check FAILED: Discrepancy between recomputed and saved predictions.")
        sys.exit(1)

    # 4. SHAP TreeExplainer calculation & verification
    print("\n[3/5] Computing SHAP values using TreeExplainer...")
    explainer = shap.TreeExplainer(model)
    shap_exp = explainer(X_sample)

    reference_val = float(shap_exp.base_values[0])
    shap_contributions = {
        feature_cols[0]: float(shap_exp.values[0][0]),
        feature_cols[1]: float(shap_exp.values[0][1]),
    }

    reproduced_pred = reference_val + sum(shap_contributions.values())
    shap_diff = abs(reproduced_pred - recomputed_pred)

    print(f"  SHAP Reference Value (Base Value): {reference_val:,.4f}")
    print(f"  Contribution ({feature_cols[0]}): {shap_contributions[feature_cols[0]]:+,.4f}")
    print(f"  Contribution ({feature_cols[1]}):        {shap_contributions[feature_cols[1]]:+,.4f}")
    print(f"  Base Value + Contributions Sum:    {reproduced_pred:,.4f}")
    print(f"  Model Prediction:                  {recomputed_pred:,.4f}")
    print(f"  Reconstruction Difference:         {shap_diff:.2e}")

    if np.isclose(reproduced_pred, recomputed_pred, atol=1e-3, rtol=1e-5):
        print("  ✓ Verification PASSED: Base value + signed contributions reproduce the model prediction.")
    else:
        print("  ✗ Verification FAILED: Base value + contributions do not match model prediction.")
        sys.exit(1)

    # 5. Save waterfall chart & explanation data
    print("\n[4/5] Saving waterfall chart and explanation data...")
    os.makedirs("results", exist_ok=True)

    # Save waterfall chart
    fig = plt.figure(figsize=(9, 5))
    shap.plots.waterfall(shap_exp[0], show=False)
    plt.title(
        f"SHAP Waterfall: Program {row['program_code']}\n{row['program_name']} ({row['university_name']})",
        fontsize=11,
        pad=15,
    )
    plt.tight_layout()
    plt.savefig(waterfall_path, dpi=300, bbox_inches="tight")
    plt.close()
    print(f"  Saved waterfall chart to: '{waterfall_path}'")

    # Save explanation JSON
    explanation_data = {
        "program_details": {
            "program_code": str(row["program_code"]),
            "university_name": str(row["university_name"]),
            "program_name": str(row["program_name"]),
        },
        "input_values": {
            "previous_closing_rank": prev_rank_val,
            "published_quota": quota_val,
        },
        "predictions_and_benchmarks": {
            "predicted_closing_rank": recomputed_pred,
            "actual_closing_rank": float(row["actual_closing_rank"]),
            "previous_year_benchmark": float(row["baseline_prediction"]),
            "model_absolute_error": float(row["model_absolute_error"]),
            "baseline_absolute_error": float(row["baseline_absolute_error"]),
        },
        "shap_explanation": {
            "reference_value": reference_val,
            "signed_contributions": shap_contributions,
            "reproduced_prediction": reproduced_pred,
            "sum_check_passed": bool(np.isclose(reproduced_pred, recomputed_pred, atol=1e-3, rtol=1e-5)),
        },
    }

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(explanation_data, f, indent=2, ensure_ascii=False)
    print(f"  Saved explanation JSON to: '{json_path}'")

    # 6. Print summary & rerun commands
    print("\n[5/5] Program Prediction & Benchmark Summary:")
    print("-" * 60)
    print(f"Program Code:              {row['program_code']}")
    print(f"University:                {row['university_name']}")
    print(f"Program:                   {row['program_name']}")
    print(f"Previous-Year Benchmark:   {float(row['baseline_prediction']):,.0f}")
    print(f"Model Predicted 2025 Rank: {recomputed_pred:,.2f}")
    print(f"Actual 2025 Closing Rank:  {float(row['actual_closing_rank']):,.0f}")
    print(f"Model Error:               {float(row['model_absolute_error']):,.2f}")
    print(f"Benchmark Error:           {float(row['baseline_absolute_error']):,.2f}")
    print("-" * 60)

    print("\nExact command to rerun:")
    print("  python explain_prediction.py")
    print("\nCommand to explain a specific program code:")
    print(f"  python explain_prediction.py --program-code {row['program_code']}")
    print("=" * 60)


if __name__ == "__main__":
    main()
