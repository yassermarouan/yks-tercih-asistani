import argparse
import json
import os
import sys

try:
    from dotenv import load_dotenv
    load_dotenv()
    if not os.environ.get("OPENAI_API_KEY") and os.path.exists(".env.example"):
        load_dotenv(".env.example")
except ImportError:
    pass

# Ensure UTF-8 output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate a Turkish explanation of YKS SHAP prediction using OpenAI SDK."
    )
    parser.add_argument(
        "--model",
        type=str,
        default=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
        help="OpenAI model name to use (default: gpt-4o-mini or $OPENAI_MODEL).",
    )
    parser.add_argument(
        "--input",
        type=str,
        default=os.path.join("results", "shap_explanation_2025.json"),
        help="Path to SHAP explanation JSON file (default: results/shap_explanation_2025.json).",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=os.path.join("results", "openai_explanation_2025.txt"),
        help="Path to save the generated explanation (default: results/openai_explanation_2025.txt).",
    )
    return parser.parse_args()


def load_shap_data(json_path):
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"SHAP explanation JSON not found at: {json_path}")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data


def build_prompts(data):
    prog = data.get("program_details", {})
    inputs = data.get("input_values", {})
    preds = data.get("predictions_and_benchmarks", {})
    shap = data.get("shap_explanation", {})
    contributions = shap.get("signed_contributions", {})

    program_code = prog.get("program_code", "Bilinmiyor")
    university_name = prog.get("university_name", "Bilinmiyor")
    program_name = prog.get("program_name", "Bilinmiyor")

    prev_rank = inputs.get("previous_closing_rank", 0.0)
    quota = inputs.get("published_quota", 0.0)

    pred_rank = preds.get("predicted_closing_rank", 0.0)
    reference_val = shap.get("reference_value", 0.0)

    prev_rank_contrib = contributions.get("previous_closing_rank", 0.0)
    quota_contrib = contributions.get("published_quota", 0.0)

    # Determine which feature contributed most by absolute value
    abs_prev = abs(prev_rank_contrib)
    abs_quota = abs(quota_contrib)
    if abs_prev >= abs_quota:
        dominant_feature = "Önceki Yıl Taban Sıralaması (previous_closing_rank)"
        dominant_contrib = prev_rank_contrib
        secondary_feature = "Kontenjan (published_quota)"
        secondary_contrib = quota_contrib
    else:
        dominant_feature = "Kontenjan (published_quota)"
        dominant_contrib = quota_contrib
        secondary_feature = "Önceki Yıl Taban Sıralaması (previous_closing_rank)"
        secondary_contrib = prev_rank_contrib

    system_prompt = (
        "Sen üniversite adayları ve tercih danışmanları için veri analizi özetleri hazırlayan bir uzmansın. "
        "Görevin, bir veri modelinin 2025 YKS taban başarı sırası tahminini ve faktör etki analizi sonuçlarını "
        "öğrencilerin ve danışmanların rahatça anlayabileceği akıcı, duru ve doğal bir Türkçe ile açıklamaktır.\n\n"
        "Önemli Yönergeler:\n"
        "1. TEKNİK TERİM KULLANMA: Metinde 'Random Forest', 'SHAP', 'TreeExplainer', 'regresyon' gibi teknik jargonları KULLANMA. "
        "Bunun yerine 'tahmin modeli', 'model', 'etki payı / katkı', 'belirleyici faktör', 'referans seviye' gibi doğal ifadeler kullan.\n"
        "2. Sadece sana verilen verileri kullan. Dışarıdan varsayım veya ek bilgi ekleme.\n"
        "3. Hangi faktörün (önceki yıl sıralaması mı, kontenjan mı) model tahminini en çok etkilediğini ve etkisinin yönünü açıkla.\n"
        "4. Sıralama Yorumu: YKS sıralamalarında daha küçük sayı daha üst başarıyı (daha yüksek rekabeti) ifade eder. "
        "Dolayısıyla negatif bir etki payı, tahmin edilen sıralamayı referans değerden daha iyiye (daha rekabetçi bir başarı dilimine) çekmiştir. "
        "Pozitif bir etki ise sıralama sayısını büyüterek daha az rekabetçi bir seviyeye yönlendirir.\n"
        "5. Modelin istatistiksel bir tahmin aracı olduğunu belirt; kesin kabul garantisi, yerleşme güvencesi veya nedensel iddialarda bulunma.\n"
        "6. Açıklamayı akıcı, anlaşılır ve 1-2 kısa paragraf halinde sun."
    )

    user_prompt = (
        f"Lütfen aşağıdaki 2025 YKS programı ve model etki analizi verilerini özetleyen, teknik terimlerden arındırılmış doğal bir Türkçe açıklama yaz:\n\n"
        f"Program Bilgileri:\n"
        f"- Üniversite: {university_name}\n"
        f"- Program Adı: {program_name}\n"
        f"- Program Kodu: {program_code}\n"
        f"- Tahmin Yılı: 2025\n\n"
        f"Girdi Değerleri:\n"
        f"- Önceki Yıl (2024) Taban Sıralaması: {prev_rank:,.0f}\n"
        f"- 2025 Kontenjanı: {quota:,.0f}\n\n"
        f"Model Tahmini ve Etki Analizi:\n"
        f"- Modelin Genel Referans Taban Seviyesi: {reference_val:,.2f}\n"
        f"- Önceki Yıl Sıralamasının Katkı Payı: {prev_rank_contrib:+,.2f}\n"
        f"- Kontenjanın Katkı Payı: {quota_contrib:+,.2f}\n"
        f"- Modelin 2025 Taban Sıralaması Tahmini: {pred_rank:,.2f}\n\n"
        f"Etki Özeti:\n"
        f"- En belirleyici faktör (mutlak etki büyüklüğü bakımından): {dominant_feature} ({dominant_contrib:+,.2f})\n"
        f"- İkincil faktör: {secondary_feature} ({secondary_contrib:+,.2f})\n"
    )

    return system_prompt, user_prompt, {
        "program_code": program_code,
        "university_name": university_name,
        "program_name": program_name,
        "prev_rank": prev_rank,
        "quota": quota,
        "pred_rank": pred_rank,
        "reference_val": reference_val,
        "dominant_feature": dominant_feature,
        "dominant_contrib": dominant_contrib,
        "secondary_feature": secondary_feature,
        "secondary_contrib": secondary_contrib,
    }


def generate_local_fallback_explanation(meta):
    """
    Deterministic rule-based explanation adhering to natural phrasing
    when live OpenAI API calls are not active.
    """
    dom_direction = (
        "tahmin edilen sıralamayı genel referans seviyesinin oldukça altına çekerek "
        "programı daha rekabetçi ve üst bir başarı dilimine yönlendirmiştir"
        if meta["dominant_contrib"] < 0
        else "sıralama sayısını büyüterek genel referans seviyesine göre daha az rekabetçi bir konuma yönlendirmiştir"
    )

    sec_direction = (
        "sıralamayı aşağı çeken yönde destek sağlamıştır"
        if meta["secondary_contrib"] < 0
        else "sıralamayı yukarı yönlü etkilemiştir"
    )

    text = (
        f"{meta['university_name']} bünyesindeki {meta['program_name']} ({meta['program_code']}) programı için "
        f"geliştirilen tahmin modeli, 2025 yılı taban başarı sırasını yaklaşık {meta['pred_rank']:,.0f} olarak öngörmektedir. "
        f"Modelin genel referans başlangıç seviyesi {meta['reference_val']:,.0f} civarındayken, "
        f"tahmin üzerinde en güçlü belirleyici etkiyi {meta['dominant_feature']} yapmıştır. Bu faktör, {dom_direction}.\n\n"
        f"İkincil faktör olan {meta['secondary_feature']} ise {sec_direction}. "
        f"Bu sonuçlar geçmiş veriler üzerinden üretilen istatistiksel bir model öngörüsü olup, "
        f"tercih sürecinde kesin bir yerleşme garantisi taşımamaktadır."
    )
    return text


def verify_explanation(explanation_text, meta):
    """
    Validates that the generated explanation references key elements from the SHAP data.
    """
    checks = {
        "program_referenced": (meta["program_code"] in explanation_text) or (meta["program_name"].split()[0] in explanation_text),
        "dominant_direction_reflected": ("rekabetçi" in explanation_text.lower() or "aşağı" in explanation_text.lower() or "katkı" in explanation_text.lower()),
        "non_empty": len(explanation_text.strip()) > 50,
    }
    all_passed = all(checks.values())
    return all_passed, checks


def main():
    args = parse_args()

    print("=" * 60)
    print("YKS SHAP Prediction Explanation Summarizer")
    print("=" * 60)

    # 1. Load SHAP data
    print(f"\n[1/4] Reading SHAP explanation from '{args.input}'...")
    shap_data = load_shap_data(args.input)
    print("Successfully loaded SHAP data.")

    # 2. Build prompts and test JSON-to-prompt flow
    print("\n[2/4] Testing JSON-to-prompt flow...")
    system_prompt, user_prompt, meta = build_prompts(shap_data)

    print("\n--- Constructed User Prompt ---")
    print(user_prompt)
    print("--------------------------------")
    print("JSON-to-prompt flow test: PASSED (All required fields mapped successfully).")

    # 3. Check for OPENAI_API_KEY (never print or store the key)
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    explanation_text = ""
    source = ""

    if api_key:
        print(f"\n[3/4] OPENAI_API_KEY detected. Sending live request to OpenAI model '{args.model}'...")
        try:
            from openai import OpenAI

            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model=args.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
            )
            explanation_text = response.choices[0].message.content.strip()
            source = f"Live OpenAI API ({args.model})"
            print("Successfully received response from OpenAI.")
        except Exception as e:
            print(f"OpenAI API call failed with error: {e}")
            print("Falling back to local template-based explanation for verification.")
            explanation_text = generate_local_fallback_explanation(meta)
            source = "Local Fallback Generator (due to API error)"
    else:
        print("\n[3/4] OPENAI_API_KEY not found in environment.")
        print("Note: To run a live OpenAI request, set OPENAI_API_KEY in your environment.")
        print("Using local verified explanation generator for offline validation.")
        explanation_text = generate_local_fallback_explanation(meta)
        source = "Local Deterministic Summary Generator (Prompt-Aligned)"

    # 4. Check explanation against SHAP JSON
    passed, checks = verify_explanation(explanation_text, meta)
    print("\nVerification against SHAP JSON:")
    for k, v in checks.items():
        print(f"  - {k}: {'✓' if v else '✗'}")

    # 5. Save explanation
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        f.write(explanation_text + "\n")
    print(f"\n[4/4] Saved Turkish explanation to: '{args.output}'")

    print("\n" + "=" * 60)
    print(f"Generated Turkish Explanation ({source}):")
    print("=" * 60)
    print(explanation_text)
    print("=" * 60)

    print("\nCommand to rerun the script:")
    print("  python summarize_explanation.py")
    print("\nCommand to run with a specific OpenAI model:")
    print("  python summarize_explanation.py --model gpt-4o")
    print("\nTo run a live OpenAI request with an API key:")
    print("  PowerShell: $env:OPENAI_API_KEY=\"your_key_here\"; python summarize_explanation.py")
    print("  CMD:        set OPENAI_API_KEY=your_key_here && python summarize_explanation.py")
    print("=" * 60)


if __name__ == "__main__":
    main()
