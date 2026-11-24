import os
import sys
import joblib
import numpy as np
import pandas as pd
import shap
from sklearn.metrics import mean_absolute_error
from typing import Dict, Any, Optional

# Ensure UTF-8 output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


class ModelService:
    def __init__(
        self,
        model_path: str = "models/yks_lgbm_models.joblib",
        test_preds_path: str = "results/test_predictions_2025.csv",
    ):
        self.model_path = model_path
        self.test_preds_path = test_preds_path
        self.bundle = None
        self.models = {}
        self.explainers = {}
        self.test_preds_df = None
        self.evaluation_summary = None
        self._load_models()
        self._load_evaluation()

    def _load_models(self):
        print(f"[ModelService] Loading LightGBM multi-score-type models from '{self.model_path}'...")
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Missing models bundle: {self.model_path}")

        self.bundle = joblib.load(self.model_path)
        self.models = self.bundle.get("score_types", {})
        self.feature_names = self.bundle.get(
            "feature_names",
            ["previous_closing_rank", "published_quota", "quota_change_pct", "rank_momentum_ratio"],
        )

        print(f"[ModelService] Initializing SHAP TreeExplainers for score types: {list(self.models.keys())}...")
        for st, m_dict in self.models.items():
            point_m = m_dict.get("point_model")
            if point_m:
                self.explainers[st] = shap.TreeExplainer(point_m)

        print("[ModelService] All LightGBM models and TreeExplainers initialized successfully.")

    def _load_evaluation(self):
        if os.path.exists(self.test_preds_path):
            print(f"[ModelService] Loading multi-score-type test predictions from '{self.test_preds_path}'...")
            self.test_preds_df = pd.read_csv(
                self.test_preds_path, dtype={"program_code": str}, encoding="utf-8-sig"
            )

            total_model_mae = float(
                mean_absolute_error(
                    self.test_preds_df["actual_closing_rank"],
                    self.test_preds_df["predicted_closing_rank"],
                )
            )
            total_base_mae = float(
                mean_absolute_error(
                    self.test_preds_df["actual_closing_rank"],
                    self.test_preds_df["baseline_prediction"],
                )
            )
            diff = abs(total_model_mae - total_base_mae)
            pct = (diff / max(total_model_mae, total_base_mae)) * 100
            winner = "lightgbm" if total_model_mae < total_base_mae else "baseline"

            self.evaluation_summary = {
                "test_year": 2025,
                "train_year": 2024,
                "score_types_supported": list(self.models.keys()),
                "test_sample_size": len(self.test_preds_df),
                "model_mae": total_model_mae,
                "baseline_mae": total_base_mae,
                "winner": winner,
                "difference": diff,
                "percentage_difference": pct,
                "by_score_type": self.bundle.get("evaluation_summary", {}),
                "methodology": {
                    "algorithm": "LightGBM (Gradient Boosting) + Quantile Regression",
                    "features": self.feature_names,
                    "target": "YKS Prospective Closing Rank",
                },
            }
            print(
                f"[ModelService] Evaluation summary computed: LightGBM MAE={total_model_mae:,.1f}, Base MAE={total_base_mae:,.1f} (Winner: {winner})"
            )
        else:
            print(f"[ModelService] Warning: '{self.test_preds_path}' not found.")

    def _extract_program_features(self, program: Dict[str, Any]):
        """
        Extracts the 4 predictive features from program history:
        1. previous_closing_rank (2025 or latest)
        2. published_quota (2025 or latest)
        3. quota_change_pct (2025 vs 2024 quota delta %)
        4. rank_momentum_ratio (2025 rank / 2024 rank)
        """
        history = program.get("history", [])
        hist_by_year = {h["year"]: h for h in history}

        rec_2025 = hist_by_year.get(2025)
        rec_2024 = hist_by_year.get(2024)
        rec_2023 = hist_by_year.get(2023)

        if rec_2025 and rec_2025.get("closing_rank") and rec_2025["closing_rank"] > 0:
            prev_rank = float(rec_2025["closing_rank"])
            quota = float(
                rec_2025.get("published_quota")
                or (rec_2024.get("published_quota") if rec_2024 else 50)
            )
            input_rank_year = 2025
            input_quota_year = 2025

            # For 2026 prospective prediction, baseline quota change is 0.0%
            # (Past quota changes e.g. 2024->2025 are already reflected in the 2025 closing rank)
            quota_change_pct = 0.0

            prior_rec = rec_2024 or rec_2023
            if prior_rec and prior_rec.get("closing_rank") and prior_rec["closing_rank"] > 0:
                prior_r = float(prior_rec["closing_rank"])
                rank_momentum_ratio = float(np.clip(prev_rank / prior_r, 0.5, 2.0))
            else:
                rank_momentum_ratio = 1.0

            latest_actual_rank = prev_rank
            latest_actual_year = 2025
        elif rec_2024 and rec_2024.get("closing_rank") and rec_2024["closing_rank"] > 0:
            prev_rank = float(rec_2024["closing_rank"])
            quota = float(
                (rec_2025.get("published_quota") if rec_2025 else None)
                or rec_2024.get("published_quota")
                or 50
            )
            input_rank_year = 2024
            input_quota_year = 2025 if (rec_2025 and rec_2025.get("published_quota")) else 2024

            quota_change_pct = 0.0

            prior_rec = rec_2023
            if prior_rec and prior_rec.get("closing_rank") and prior_rec["closing_rank"] > 0:
                prior_r = float(prior_rec["closing_rank"])
                rank_momentum_ratio = float(np.clip(prev_rank / prior_r, 0.5, 2.0))
            else:
                rank_momentum_ratio = 1.0

            latest_actual_rank = prev_rank
            latest_actual_year = 2024
        else:
            return None

        return {
            "previous_closing_rank": prev_rank,
            "published_quota": quota,
            "quota_change_pct": quota_change_pct,
            "rank_momentum_ratio": rank_momentum_ratio,
            "input_rank_year": input_rank_year,
            "input_quota_year": input_quota_year,
            "latest_actual_rank": latest_actual_rank,
            "latest_actual_year": latest_actual_year,
            "target_year": 2026,
        }

    def get_prediction_and_shap(self, program: Dict[str, Any]) -> Dict[str, Any]:
        """
        Computes prospective LightGBM model prediction, quantile confidence interval,
        and 4-feature SHAP waterfall decomposition for a program.
        """
        score_type = program.get("score_type", "").upper()
        if score_type not in self.models:
            return {
                "status": "unsupported_score_type",
                "score_type": score_type,
                "message": f"'{score_type}' türü için model bulunamadı. Desteklenen türler: {list(self.models.keys())}",
            }

        extracted = self._extract_program_features(program)
        if not extracted:
            return {
                "status": "missing_inputs",
                "score_type": score_type,
                "message": "Model projeksiyonu için programın geçmiş taban sıralaması ve kontenjanı bulunamadı.",
            }

        prev_rank = extracted["previous_closing_rank"]
        quota = extracted["published_quota"]
        quota_change_pct = extracted["quota_change_pct"]
        momentum = extracted["rank_momentum_ratio"]

        # 4 features in exact trained order
        feature_cols = ["previous_closing_rank", "published_quota", "quota_change_pct", "rank_momentum_ratio"]
        X_sample = pd.DataFrame(
            [[prev_rank, quota, quota_change_pct, momentum]],
            columns=feature_cols,
        )

        m_dict = self.models[score_type]
        m_point = m_dict["point_model"]
        m_lower = m_dict["lower_model"]
        m_upper = m_dict["upper_model"]

        # 1. Point prediction (mean regression)
        pred_point = float(m_point.predict(X_sample)[0])

        # 2. Quantile confidence interval (10th & 90th percentile bounds)
        pred_lower_raw = float(m_lower.predict(X_sample)[0])
        pred_upper_raw = float(m_upper.predict(X_sample)[0])

        # Logical sanity check: lower <= point <= upper
        lower_bound = float(min(pred_lower_raw, pred_point * 0.95))
        upper_bound = float(max(pred_upper_raw, pred_point * 1.05))
        margin_pct = float(((upper_bound - lower_bound) / (2 * pred_point)) * 100)

        # 3. SHAP TreeExplainer decomposition
        explainer = self.explainers[score_type]
        shap_res = explainer(X_sample)
        base_val = float(explainer.expected_value)
        contributions = {
            "previous_closing_rank": float(shap_res.values[0][0]),
            "published_quota": float(shap_res.values[0][1]),
            "quota_change_pct": float(shap_res.values[0][2]),
            "rank_momentum_ratio": float(shap_res.values[0][3]),
        }

        reproduced = base_val + sum(contributions.values())
        verification_passed = bool(abs(reproduced - pred_point) < 0.1)

        # Determine dominant feature
        dominant_feature = max(contributions.keys(), key=lambda k: abs(contributions[k]))

        # Format waterfall steps for frontend
        cum = base_val
        waterfall_steps = [
            {
                "step": "base_value",
                "label": f"Model Başlangıç Seviyesi ({score_type} Ortalaması)",
                "value": base_val,
                "change": base_val,
                "cumulative": base_val,
            }
        ]

        step_labels = {
            "previous_closing_rank": f"{extracted['input_rank_year']} Taban Sıralaması Etkisi",
            "published_quota": f"{extracted['input_quota_year']} Kontenjan Büyüklüğü Etkisi",
            "quota_change_pct": (
                f"Kontenjan Değişim Yüzdesi Etkisi (%{quota_change_pct:+.1f})"
                if abs(quota_change_pct) > 0.01
                else "Kontenjan Değişimi Etkisi (Sabit Kontenjan - %0.0)"
            ),
            "rank_momentum_ratio": f"Sıralama Trendi / İvmesi Etkisi ({momentum:.2f}x)",
        }

        for feat_name in feature_cols:
            chg = contributions[feat_name]
            cum += chg
            waterfall_steps.append({
                "step": feat_name,
                "label": step_labels[feat_name],
                "input_val": float(X_sample[feat_name].iloc[0]),
                "change": chg,
                "cumulative": cum,
            })

        waterfall_steps.append({
            "step": "final_prediction",
            "label": f"{extracted['target_year']} Projeksiyon Taban Sıralaması",
            "value": pred_point,
            "change": 0,
            "cumulative": pred_point,
        })

        return {
            "status": "success",
            "target_year": extracted["target_year"],
            "score_type": score_type,
            "model_label": f"2026 YKS {score_type} Taban Sıralaması Projeksiyonu (LightGBM)",
            "inputs": {
                "previous_closing_rank": prev_rank,
                "input_rank_year": extracted["input_rank_year"],
                "published_quota": int(quota),
                "input_quota_year": extracted["input_quota_year"],
                "quota_change_pct": quota_change_pct,
                "rank_momentum_ratio": momentum,
            },
            "predictions": {
                "predicted_closing_rank": pred_point,
                "prediction_interval": {
                    "lower": lower_bound,
                    "upper": upper_bound,
                    "margin_pct": margin_pct,
                    "confidence_level": 80,
                },
                "latest_actual_closing_rank": extracted["latest_actual_rank"],
                "latest_actual_year": extracted["latest_actual_year"],
                "baseline_prediction": prev_rank,
            },
            "shap": {
                "reference_value": base_val,
                "signed_contributions": contributions,
                "reproduced_prediction": reproduced,
                "verification_passed": verification_passed,
                "dominant_feature": dominant_feature,
                "waterfall_steps": waterfall_steps,
            },
        }

    def simulate_prediction(
        self,
        program: Dict[str, Any],
        simulated_quota: int,
        student_rank: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Simulates what happens to the prospective closing rank if quota changes,
        now supporting ALL score types (SAY, EA, SÖZ, DİL) with LightGBM models.
        """
        score_type = program.get("score_type", "").upper()
        if score_type not in self.models:
            return {
                "status": "unsupported_score_type",
                "message": f"'{score_type}' türü için simülasyon modeli bulunamadı.",
            }

        if simulated_quota <= 0:
            return {
                "status": "invalid_input",
                "message": "Simüle edilen kontenjan 0'dan büyük bir tamsayı olmalıdır.",
            }

        # Baseline prospective prediction
        baseline_res = self.get_prediction_and_shap(program)
        if baseline_res.get("status") != "success":
            return baseline_res

        prev_rank = baseline_res["inputs"]["previous_closing_rank"]
        orig_quota = baseline_res["inputs"]["published_quota"]
        base_pred = baseline_res["predictions"]["predicted_closing_rank"]
        momentum = baseline_res["inputs"]["rank_momentum_ratio"]

        # Recalculate quota delta & simulated quota change percentage (with Laplace damping k=10)
        quota_delta = simulated_quota - orig_quota
        sim_quota_change_pct = float(np.clip(((simulated_quota - orig_quota) / (orig_quota + 10)) * 100, -80, 200))

        # Build simulated features
        feature_cols = ["previous_closing_rank", "published_quota", "quota_change_pct", "rank_momentum_ratio"]
        X_sim = pd.DataFrame(
            [[float(prev_rank), float(simulated_quota), sim_quota_change_pct, float(momentum)]],
            columns=feature_cols,
        )

        m_dict = self.models[score_type]
        m_point = m_dict["point_model"]
        m_lower = m_dict["lower_model"]
        m_upper = m_dict["upper_model"]

        sim_pred = float(m_point.predict(X_sim)[0])
        sim_lower = float(min(m_lower.predict(X_sim)[0], sim_pred * 0.95))
        sim_upper = float(max(m_upper.predict(X_sim)[0], sim_pred * 1.05))
        sim_margin_pct = float(((sim_upper - sim_lower) / (2 * sim_pred)) * 100)

        # Run SHAP on simulated input
        explainer = self.explainers[score_type]
        shap_sim = explainer(X_sim)
        orig_shap_quota = baseline_res["shap"]["signed_contributions"]["published_quota"]
        sim_shap_quota = float(shap_sim.values[0][1])

        rank_delta = sim_pred - base_pred

        # Categorization function helper
        def get_cat(r_base: float, s_rank: int):
            if r_base < s_rank * 0.85:
                return "reach", "Daha Rekabetçi"
            elif s_rank * 0.85 <= r_base <= s_rank * 1.25:
                return "target", "Sıralamana Yakın"
            else:
                return "safe", "Daha Ulaşılabilir"

        candidate_impact = None
        if student_rank and student_rank > 0:
            base_cat, base_cat_label = get_cat(base_pred, student_rank)
            sim_cat, sim_cat_label = get_cat(sim_pred, student_rank)

            candidate_impact = {
                "student_rank": student_rank,
                "base_category": base_cat,
                "base_category_label": base_cat_label,
                "simulated_category": sim_cat,
                "simulated_category_label": sim_cat_label,
                "category_changed": base_cat != sim_cat,
                "base_distance": int(student_rank - base_pred),
                "simulated_distance": int(student_rank - sim_pred),
            }

        # Natural summary of the simulation
        if quota_delta > 0:
            if rank_delta > 0:
                interpretation = (
                    f"Kontenjanın {quota_delta} kişi artırılması (%{sim_quota_change_pct:+.1f}), taban sıralamayı yaklaşık {abs(rank_delta):,.0f} sıra "
                    f"daha geriye esneterek programı daha ulaşılabilir (girilmesi daha kolay) hale getirmektedir."
                )
            else:
                interpretation = (
                    f"Kontenjan {quota_delta} kişi artırılmasına rağmen programın güçlü geçmiş talep ivmesi "
                    f"sıralamanın üst dilimde kalmasını sağlamaktadır."
                )
        elif quota_delta < 0:
            if rank_delta < 0:
                interpretation = (
                    f"Kontenjanın {abs(quota_delta)} kişi daraltılması (%{sim_quota_change_pct:+.1f}), programdaki rekabeti artırarak "
                    f"taban sıralamayı yaklaşık {abs(rank_delta):,.0f} sıra daha öne (daha üst dilime) çekmektedir."
                )
            else:
                interpretation = (
                    f"Kontenjan {abs(quota_delta)} kişi azaltılmasına rağmen geçmiş eğilim belirleyici kalmaktadır."
                )
        else:
            interpretation = "Kontenjanda herhangi bir değişiklik yapılmadığı için baz model projeksiyonu geçerlidir."

        return {
            "status": "success",
            "score_type": score_type,
            "program_code": program.get("program_code"),
            "program_name": program.get("program_name"),
            "university_name": program.get("university_name"),
            "previous_closing_rank": prev_rank,
            "original_quota": orig_quota,
            "simulated_quota": simulated_quota,
            "quota_delta": quota_delta,
            "sim_quota_change_pct": sim_quota_change_pct,
            "baseline_predicted_rank": base_pred,
            "simulated_predicted_rank": sim_pred,
            "simulated_prediction_interval": {
                "lower": sim_lower,
                "upper": sim_upper,
                "margin_pct": sim_margin_pct,
            },
            "rank_delta": rank_delta,
            "original_shap_quota": orig_shap_quota,
            "simulated_shap_quota": sim_shap_quota,
            "candidate_impact": candidate_impact,
            "interpretation": interpretation,
        }

    def get_evaluation(self) -> Optional[Dict[str, Any]]:
        return self.evaluation_summary
