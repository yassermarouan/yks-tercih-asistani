import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# ==============================================================================
# Renk Paleti (Akademik Koyu Slate, Zümrüt Yeşili & Siyanür)
# ==============================================================================
COLOR_BG_DARK = RGBColor(7, 12, 22)        # #070C16
COLOR_CARD_BG = RGBColor(16, 26, 48)       # #101A30
COLOR_CARD_BORDER = RGBColor(38, 55, 88)   # #263758
COLOR_EMERALD = RGBColor(16, 185, 129)     # #10B981
COLOR_CYAN = RGBColor(6, 182, 212)         # #06B6D4
COLOR_AMBER = RGBColor(245, 158, 11)       # #F59E0B
COLOR_ROSE = RGBColor(244, 63, 94)         # #F43F5E
COLOR_TEXT_WHITE = RGBColor(255, 255, 255) # #FFFFFF
COLOR_TEXT_MUTED = RGBColor(148, 163, 184) # #94A3B8
COLOR_TEXT_DIM = RGBColor(100, 116, 139)   # #64748B

FONT_TITLE = "Segoe UI"
FONT_BODY = "Segoe UI"
FONT_CODE = "Consolas"

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6] # completely blank layout

    def apply_slide_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = COLOR_BG_DARK
        bg.line.fill.background()
        return bg

    def add_slide_header(slide, section_tag, title_text, subtitle_text=""):
        # Header container
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(1.2))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        
        # Tag
        p_tag = tf.paragraphs[0]
        p_tag.text = section_tag.upper()
        p_tag.font.name = FONT_TITLE
        p_tag.font.size = Pt(9.5)
        p_tag.font.bold = True
        p_tag.font.color.rgb = COLOR_EMERALD
        p_tag.space_after = Pt(2)
        
        # Title
        p_title = tf.add_paragraph()
        p_title.text = title_text
        p_title.font.name = FONT_TITLE
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_TEXT_WHITE
        p_title.space_after = Pt(2)

        # Subtitle
        if subtitle_text:
            p_sub = tf.add_paragraph()
            p_sub.text = subtitle_text
            p_sub.font.name = FONT_BODY
            p_sub.font.size = Pt(11)
            p_sub.font.color.rgb = COLOR_TEXT_MUTED

    def add_card(slide, left, top, width, height, bg_color=COLOR_CARD_BG, border_color=COLOR_CARD_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1)
        return card

    def add_speaker_notes(slide, notes_text):
        notes_slide = slide.notes_slide
        text_frame = notes_slide.notes_text_frame
        text_frame.text = notes_text

    # ==========================================================================
    # SLAYT 1: Başlık Slaytı (Title Slide)
    # ==========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    apply_slide_background(s1)

    # Hero Pill
    pill = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.2), Inches(5.8), Inches(0.42))
    pill.fill.solid()
    pill.fill.fore_color.rgb = RGBColor(20, 35, 60)
    pill.line.color.rgb = COLOR_CYAN
    pill.line.width = Pt(1)
    tf_pill = pill.text_frame
    p_pill = tf_pill.paragraphs[0]
    p_pill.text = "🧠 BİLİŞİM SİSTEMLERİ & MAKİNE ÖĞRENMESİ • AKADEMİK SUNUM"
    p_pill.font.name = FONT_TITLE
    p_pill.font.size = Pt(9.5)
    p_pill.font.bold = True
    p_pill.font.color.rgb = COLOR_CYAN
    p_pill.alignment = PP_ALIGN.CENTER

    # Main Title & Subtitle Box
    tb_title = s1.shapes.add_textbox(Inches(0.8), Inches(1.85), Inches(11.733), Inches(2.2))
    tf_title = tb_title.text_frame
    tf_title.word_wrap = True
    
    p_t1 = tf_title.paragraphs[0]
    p_t1.text = "Açıklanabilir Yapay Zekâ"
    p_t1.font.name = FONT_TITLE
    p_t1.font.size = Pt(40)
    p_t1.font.bold = True
    p_t1.font.color.rgb = COLOR_TEXT_WHITE
    
    p_t2 = tf_title.add_paragraph()
    p_t2.text = "(Explainable AI – XAI)"
    p_t2.font.name = FONT_TITLE
    p_t2.font.size = Pt(36)
    p_t2.font.bold = True
    p_t2.font.color.rgb = COLOR_EMERALD
    p_t2.space_after = Pt(14)

    p_sub = tf_title.add_paragraph()
    p_sub.text = "Kara Kutu Modellerden Şeffaf Karar Destek Sistemlerine: Kuramsal Temeller, Yöntemler ve YKS Yerleştirme Verisi Üzerinde Gerçek Bir Uygulama Örneği"
    p_sub.font.name = FONT_BODY
    p_sub.font.size = Pt(14)
    p_sub.font.color.rgb = COLOR_TEXT_MUTED

    # 4 Meta Cards
    meta_info = [
        ("ODAK KONUSU", "XAI & Şeffaf Karar Modelleri"),
        ("UYGULAMA ALANI", "13.581 Lisans Programı & Karar Desteği"),
        ("TEMEL YÖNTEMLER", "TreeSHAP, Feature Importance, What-If"),
        ("SUNUM NİTELİĞİ", "Teori (%70) & Uygulamalı Vaka (%30)")
    ]
    card_w = Inches(2.75)
    gap = Inches(0.24)
    start_left = Inches(0.8)
    top_pos = Inches(4.7)

    for i, (m_lbl, m_val) in enumerate(meta_info):
        c_left = start_left + i * (card_w + gap)
        add_card(s1, c_left, top_pos, card_w, Inches(1.5))
        tb_m = s1.shapes.add_textbox(c_left + Inches(0.15), top_pos + Inches(0.15), card_w - Inches(0.3), Inches(1.2))
        tf_m = tb_m.text_frame
        tf_m.word_wrap = True
        
        p_lbl = tf_m.paragraphs[0]
        p_lbl.text = m_lbl
        p_lbl.font.size = Pt(8.5)
        p_lbl.font.bold = True
        p_lbl.font.color.rgb = COLOR_TEXT_DIM
        p_lbl.space_after = Pt(4)

        p_val = tf_m.add_paragraph()
        p_val.text = m_val
        p_val.font.size = Pt(11)
        p_val.font.bold = True
        p_val.font.color.rgb = COLOR_TEXT_WHITE

    add_speaker_notes(s1, 
        "Değerli jüri üyeleri ve katılımcılar, bugün modern yapay zekâ araştırmalarının en hayati eşiği olan "
        "'Açıklanabilir Yapay Zekâ (Explainable Artificial Intelligence – XAI)' konusunu ele alacağız.\n\n"
        "Sunumumuz iki ana sütundan oluşmaktadır: İlk %70'lik bölümde XAI'ın kuramsal temellerini, kara kutu problemini, "
        "regülasyonları ve matematiksel yöntemleri inceleyeceğiz. İkinci %30'luk bölümde ise bu teorik prensipleri "
        "bizzat geliştirdiğimiz ve 13.581 lisans programını içeren YKS Tercih Karar Destek Sistemi üzerindeki canlı uygulama "
        "ve 7.811 kör test verisi sonuçlarıyla kanıtlayacağız."
    )

    # ==========================================================================
    # SLAYT 2: Kara Kutu Problemi & Güven Krizi
    # ==========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    apply_slide_background(s2)
    add_slide_header(s2, "Kuramsal Çerçeve • 01", "Kara Kutu (Black Box) Problemi & Güven Krizi", 
                     "Karmaşık yapay zekâ modellerinin içsel karar mekanizmasının insani anlayışa kapalı olması sorunu.")

    # Sol Kart: Kara Kutu Nedir?
    add_card(s2, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.9))
    tb_c1 = s2.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(5.2), Inches(4.5))
    tf_c1 = tb_c1.text_frame
    tf_c1.word_wrap = True

    p = tf_c1.paragraphs[0]
    p.text = "⚠️ Kara Kutu Nasıl Oluşur?"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = COLOR_AMBER
    p.space_after = Pt(10)

    p = tf_c1.add_paragraph()
    p.text = "Geleneksel makine öğrenmesinde model karmaşıklığı arttıkça, tahmin doğruluğu artmakta fakat modelin yorumlanabilirliği dramatik biçimde düşmektedir (Accuracy vs. Interpretability Trade-off)."
    p.font.size = Pt(10.5)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.space_after = Pt(12)

    bullets = [
        ("Opak Karar Mekanizması: ", "Milyonlarca parametre ve doğrusal olmayan dallanmalar matematiksel bir labirent yaratır."),
        ("Gizli Yanlılık (Hidden Bias): ", "Tarihsel verideki önyargılar modelin derinliklerinde fark edilmeden büyür."),
        ("Kusurlu Güven (Blind Trust): ", "Kullanıcı kararın nedenini göremediğinde hatalı tahminleri tespit edemez.")
    ]
    for b_title, b_desc in bullets:
        p = tf_c1.add_paragraph()
        p.text = f"• {b_title}"
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEXT_WHITE
        p.space_after = Pt(2)
        p2 = tf_c1.add_paragraph()
        p2.text = f"   {b_desc}"
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = COLOR_TEXT_MUTED
        p2.space_after = Pt(6)

    # Sağ Kart: Accuracy vs Interpretability
    add_card(s2, Inches(6.8), Inches(1.8), Inches(5.7), Inches(4.9))
    tb_c2 = s2.shapes.add_textbox(Inches(7.0), Inches(2.0), Inches(5.3), Inches(4.5))
    tf_c2 = tb_c2.text_frame
    tf_c2.word_wrap = True

    p = tf_c2.paragraphs[0]
    p.text = "📊 Doğruluk ve Yorumlanabilirlik İkilemi"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = COLOR_CYAN
    p.space_after = Pt(10)

    items = [
        ("Doğrusal Regresyon / Karar Ağacı", "Yüksek Yorumlanabilir • Düşük Karmaşıklık", "Açıklanabilirlik: %90"),
        ("Topluluk Ağaçları (LightGBM, Random Forest)", "Yüksek Doğruluk • XAI ile Şeffaflaştırılabilir", "Açıklanabilirlik: %65 (XAI ile %95)"),
        ("Derin Öğrenme / Transformatörler", "Çok Yüksek Karmaşıklık • Tam Kara Kutu", "Açıklanabilirlik: %20")
    ]
    for title, sub, score in items:
        p = tf_c2.add_paragraph()
        p.text = f"▶ {title}"
        p.font.size = Pt(10.5)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEXT_WHITE
        
        p = tf_c2.add_paragraph()
        p.text = f"    {sub} | {score}"
        p.font.size = Pt(9)
        p.font.color.rgb = COLOR_EMERALD if "XAI ile" in score else COLOR_TEXT_MUTED
        p.space_after = Pt(10)

    p = tf_c2.add_paragraph()
    p.text = "🎯 XAI'ın Misyonu:"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_EMERALD
    p = tf_c2.add_paragraph()
    p.text = "Yüksek performanslı topluluk modellerini doğruluk kaybı yaşamadan şeffaf, hesap verebilir ve güvenilir kılmaktır."
    p.font.size = Pt(10)
    p.font.color.rgb = COLOR_TEXT_MUTED

    add_speaker_notes(s2, 
        "Makine öğrenmesi tarihsel olarak iki kutup arasında sıkışmıştır. Bir tarafta katsayılarını net gördüğümüz ama "
        "karmaşık dünyayı modelleyemeyen basit doğrusal regresyonlar; diğer tarafta ise milyarlarca ağırlığıyla yüksek doğrulukla "
        "tahmin yapan ama 'neden' sorusuna cevap veremeyen derin ağlar bulunmaktadır.\n\n"
        "Eğer bir yapay zekâ bir öğrenciye 'Sen bu üniversiteye giremezsin' veya bir doktora 'Bu hasta kanserdir' diyorsa, "
        "tek başına bu çıktı yetersizdir. 'Neden?' sorusunun cevabı hayati bir haktır. İşte XAI, doğruluğu feda etmeden bu şeffaflığı inşa etme çabasıdır."
    )

    # ==========================================================================
    # SLAYT 3: XAI Neden Zorunludur?
    # ==========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    apply_slide_background(s3)
    add_slide_header(s3, "Kuramsal Çerçeve • 02", "Açıklanabilir Yapay Zekâ Neden Zorunludur?", 
                     "Yasal yaptırımlar, etik sorumluluklar ve kritik karar destek alanlarındaki gereksinimler.")

    pillars = [
        ("01", "Yasal Uyumluluk & GDPR", "Avrupa Birliği Genel Veri Koruma Tüzüğü (GDPR Madde 22) ve AB Yapay Zekâ Yasası (EU AI Act), bireylerin otomatik kararlar karşısında 'Açıklama Hakkı'na (Right to Explanation) sahip olduğunu yasal olarak hükme bağlamıştır."),
        ("02", "Kritik Karar Desteği", "Tıp, finans, adalet ve üniversite yerleştirme kararları gibi insan hayatını ve geleceğini doğrudan etkileyen yüksek riskli (high-stakes) alanlarda gerekçelendirilmemiş tahminlerin kullanılması kabul edilemez."),
        ("03", "Hata Ayıklama & Denetim", "Model geliştiricileri yalnızca test doğruluğuna (accuracy/MAE) bakarak modelin doğru nedenlerle mi yoksa sahte korelasyonlarla (spurious correlation) mı doğru sonuç verdiğini anlayamazlar. XAI modeli denetleme aracıdır."),
        ("04", "İnsan-YZ Güven Ortaklığı", "Yapay zekâ karar vericinin yerini alan bir otonom hükümdar değil; kararı zenginleştiren bir danışmandır (Human-in-the-loop). Kararın arkasındaki dinamikler anlaşıldığında insanın YZ ile işbirliği kalitesi artar.")
    ]

    p_w = Inches(2.75)
    p_gap = Inches(0.24)
    for i, (num, h_text, b_text) in enumerate(pillars):
        p_left = Inches(0.8) + i * (p_w + p_gap)
        add_card(s3, p_left, Inches(1.8), p_w, Inches(3.8))
        tb_p = s3.shapes.add_textbox(p_left + Inches(0.15), Inches(1.95), p_w - Inches(0.3), Inches(3.5))
        tf_p = tb_p.text_frame
        tf_p.word_wrap = True

        p = tf_p.paragraphs[0]
        p.text = num
        p.font.name = FONT_CODE
        p.font.size = Pt(20)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEXT_DIM
        p.space_after = Pt(4)

        p = tf_p.add_paragraph()
        p.text = h_text
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEXT_WHITE
        p.space_after = Pt(8)

        p = tf_p.add_paragraph()
        p.text = b_text
        p.font.size = Pt(9.2)
        p.font.color.rgb = COLOR_TEXT_MUTED

    # Alt Alıntı Kartı
    add_card(s3, Inches(0.8), Inches(5.8), Inches(11.733), Inches(0.9), bg_color=RGBColor(12, 22, 42), border_color=COLOR_EMERALD)
    tb_q = s3.shapes.add_textbox(Inches(1.0), Inches(5.85), Inches(11.333), Inches(0.8))
    tf_q = tb_q.text_frame
    tf_q.word_wrap = True
    p = tf_q.paragraphs[0]
    p.text = "“Sadece çıktıyı bilmek bir kehanettir; karara giden yolu ve dayanaklarını bilmek ise bilimdir.”"
    p.font.size = Pt(11.5)
    p.font.italic = True
    p.font.color.rgb = COLOR_TEXT_WHITE
    p = tf_q.add_paragraph()
    p.text = "— XAI Akademik Literatür Prensibi (EU High-Level Expert Group on AI)"
    p.font.size = Pt(9)
    p.font.bold = True
    p.font.color.rgb = COLOR_EMERALD

    add_speaker_notes(s3, 
        "XAI artık teorik bir lüks veya akademisyenlerin entelektüel merakı değildir; kanuni ve operasyonel bir zorunluluktur. "
        "Avrupa Birliği'nin Yapay Zeka Yasası (EU AI Act), eğitim ve kariyer seçimini 'Yüksek Riskli Sistemler' kategorisine almıştır.\n\n"
        "Bir öğrencinin tüm lise hayatı boyunca hazırlandığı YKS tercih listesinde, bir algoritmanın 'burayı yazma, açıkta kalırsın' "
        "demesi öğrenci için travmatiktir. Ancak 'Geçen yıl kontenjan %20 daraldı, son 3 yıldır talep ivmesi öne çekiliyor, "
        "bu yüzden taban sırası 40.000'e kayabilir' dediğiniz anda öğrenciye eyleme geçirilebilir bir strateji vermiş olursunuz."
    )

    # ==========================================================================
    # SLAYT 4: Geleneksel YZ vs. Açıklanabilir YZ
    # ==========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    apply_slide_background(s4)
    add_slide_header(s4, "Kuramsal Çerçeve • 03", "Geleneksel YZ vs. Açıklanabilir YZ (XAI)", 
                     "Sadece tahmin üretmekten, matematiksel gerekçesi doğrulanmış karar sunmaya geçiş.")

    # Sol: Geleneksel
    add_card(s4, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.9))
    tb_t = s4.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(5.2), Inches(4.5))
    tf_t = tb_t.text_frame
    tf_t.word_wrap = True

    p = tf_t.paragraphs[0]
    p.text = "🔴 GELENEKSEL KARA KUTU YZ"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = COLOR_ROSE
    p.space_after = Pt(2)

    p = tf_t.add_paragraph()
    p.text = "Sadece Tahmin Odaklı: y = f(X)"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_WHITE
    p.space_after = Pt(10)

    p = tf_t.add_paragraph()
    p.text = "Akış: Girdi (X) ➔ [KAPALI KUTU f(X)] ➔ Çıktı (y_tahmin)"
    p.font.name = FONT_CODE
    p.font.size = Pt(9.5)
    p.font.color.rgb = COLOR_ROSE
    p.space_after = Pt(12)

    t_points = [
        ("Temel Soru: ", "'Sonuç nedir?' (Sadece sayısal değer)"),
        ("Kullanıcı Rolü: ", "Pasif alıcı veya körü körüne reddedici"),
        ("Hata Tespiti: ", "Yalnızca sonuç gerçek dünyada başarısız olunca anlaşılır"),
        ("Açıklama: ", "Yok ('Model böyle hesapladı')"),
        ("Güven Temeli: ", "Körü körüne inanç")
    ]
    for lbl, desc in t_points:
        p = tf_t.add_paragraph()
        p.text = f"• {lbl}{desc}"
        p.font.size = Pt(9.5)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.space_after = Pt(6)

    # Sağ: XAI
    add_card(s4, Inches(6.8), Inches(1.8), Inches(5.7), Inches(4.9), border_color=COLOR_EMERALD)
    tb_x = s4.shapes.add_textbox(Inches(7.0), Inches(2.0), Inches(5.3), Inches(4.5))
    tf_x = tb_x.text_frame
    tf_x.word_wrap = True

    p = tf_x.paragraphs[0]
    p.text = "🟢 AÇIKLANABİLİR YAPAY ZEKÂ (XAI)"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = COLOR_EMERALD
    p.space_after = Pt(2)

    p = tf_x.add_paragraph()
    p.text = "Gerekçe & Kanıt Odaklı: <y, Φ> = f_XAI(X)"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_WHITE
    p.space_after = Pt(10)

    p = tf_x.add_paragraph()
    p.text = "Akış: Girdi (X) ➔ [ŞEFFAF MODEL & Φ] ➔ Tahmin + Gerekçe + Koridor"
    p.font.name = FONT_CODE
    p.font.size = Pt(9.5)
    p.font.color.rgb = COLOR_EMERALD
    p.space_after = Pt(12)

    x_points = [
        ("Temel Soru: ", "'Neden bu sonuç çıktı?' ve 'Girdi değişseydi ne olurdu?'"),
        ("Kullanıcı Rolü: ", "Kararı denetleyen, senaryoları simüle eden aktif uzman"),
        ("Hata Tespiti: ", "Mantıksız etki veya anomali anında grafiklerle görünür"),
        ("Açıklama: ", "Shapley katkıları, öznitelik ağırlıkları, karşı-olgusal kanıt"),
        ("Güven Temeli: ", "Matematiksel ve nedensel kanıta dayalı güven")
    ]
    for lbl, desc in x_points:
        p = tf_x.add_paragraph()
        p.text = f"• {lbl}{desc}"
        p.font.size = Pt(9.5)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.space_after = Pt(6)

    add_speaker_notes(s4, 
        "Bu slaytta iki paradigmanın temel mimari farkını görüyoruz. Geleneksel yapay zekâda f(X) fonksiyonu kapalı bir kutudur; "
        "girdi girer, çıktı çıkar. Eğer bir anormallik varsa sistem sizi uyarmaz.\n\n"
        "Açıklanabilir yapay zekâda ise f(X) çıktısı tek başına bir ürün değildir. Çıktının yanına 'Phi' yerel katkı vektörü, "
        "yani her özniteliğin karara pozitif veya negatif yönlü katkısı eklenir. Böylece kullanıcı yalnızca 'ne' olduğunu değil, "
        "'nasıl' ve 'neden' olduğunu da eşzamanlı olarak görür."
    )

    # ==========================================================================
    # SLAYT 5: XAI Yöntemlerinin Taksonomisi
    # ==========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    apply_slide_background(s5)
    add_slide_header(s5, "Metodoloji • 01", "Açıklanabilir Yapay Zekâ Yöntemlerinin Taksonomisi", 
                     "Literatürde XAI tekniklerinin zamanlama, kapsam ve model bağımlılığına göre 3 eksenli sınıflandırılması.")

    tax_dims = [
        ("1. EKSEN: ZAMANLAMA", "Intrinsic vs. Post-hoc", [
            ("Doğal (Intrinsic / Ante-hoc):", "Model doğası gereği basittir ve kendini eğitirken açıklar (Doğrusal Regresyon, Tek Karar Ağacı)."),
            ("Model Sonrası (Post-hoc):", "Karmaşık model eğitildikten sonra harici bir açıklayıcı algoritma (SHAP, LIME) devreye girer.")
        ]),
        ("2. EKSEN: KAPSAM", "Global vs. Local", [
            ("Küresel (Global Interpretability):", "Modelin genel veri setindeki genel davranışını ve öznitelik önem hiyerarşisini gösterir."),
            ("Yerel (Local Explainability):", "Tekil bir veri örneği için (Örn: Ege Bilgisayar) kararın nedenlerini açıklar.")
        ]),
        ("3. EKSEN: MODEL BAĞIMLILIĞI", "Model-Agnostic vs. Specific", [
            ("Modele Bağımsız (Model-Agnostic):", "Herhangi bir kara kutu modele uygulanabilen genel yöntemler (KernelSHAP, LIME)."),
            ("Modele Özgü (Model-Specific):", "Belirli mimarilerin iç yapısını kullanarak çok hızlı hesaplama yapan yöntemler (TreeSHAP).")
        ])
    ]

    t_w = Inches(3.7)
    t_gap = Inches(0.26)
    for i, (dim_tag, dim_title, items) in enumerate(tax_dims):
        t_left = Inches(0.8) + i * (t_w + t_gap)
        add_card(s5, t_left, Inches(1.8), t_w, Inches(3.8))
        tb_t = s5.shapes.add_textbox(t_left + Inches(0.15), Inches(1.95), t_w - Inches(0.3), Inches(3.5))
        tf_t = tb_t.text_frame
        tf_t.word_wrap = True

        p = tf_t.paragraphs[0]
        p.text = dim_tag
        p.font.size = Pt(8.5)
        p.font.bold = True
        p.font.color.rgb = COLOR_CYAN
        p.space_after = Pt(2)

        p = tf_t.add_paragraph()
        p.text = dim_title
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEXT_WHITE
        p.space_after = Pt(10)

        for h, d in items:
            p = tf_t.add_paragraph()
            p.text = f"▶ {h}"
            p.font.size = Pt(10)
            p.font.bold = True
            p.font.color.rgb = COLOR_EMERALD if "Post-hoc" in h or "Yerel" in h or "Özgü" in h else COLOR_TEXT_WHITE
            p.space_after = Pt(2)
            p = tf_t.add_paragraph()
            p.text = f"   {d}"
            p.font.size = Pt(9)
            p.font.color.rgb = COLOR_TEXT_MUTED
            p.space_after = Pt(8)

    # Alt Karar Şeridi
    add_card(s5, Inches(0.8), Inches(5.8), Inches(11.733), Inches(0.9), bg_color=RGBColor(12, 25, 45), border_color=COLOR_EMERALD)
    tb_c = s5.shapes.add_textbox(Inches(1.0), Inches(5.9), Inches(11.333), Inches(0.7))
    tf_c = tb_c.text_frame
    tf_c.word_wrap = True
    p = tf_c.paragraphs[0]
    p.text = "🎯 Projemizin Metodolojik Tercihi: Post-Hoc + Yerel (Local) + Küresel (Global) + Modele Özgü Hızlı Ağaç Çözümleyicisi (TreeSHAP)"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_EMERALD
    p = tf_c.add_paragraph()
    p.text = "Yüksek tahmin doğruluğuna sahip LightGBM modellerini korurken, milisaniyeler içinde tekil öğrenci kararlarını açıklama gücü sağlanmıştır."
    p.font.size = Pt(9.5)
    p.font.color.rgb = COLOR_TEXT_MUTED

    add_speaker_notes(s5, 
        "Akademik literatürde Christoph Molnar ve Marco Ribeiro'nun tanımladığı taksonomiye göre XAI yöntemleri 3 ana eksende sınıflandırılır: "
        "Ne zaman açıklıyoruz? (Intrinsic/Post-hoc), Kimi açıklıyoruz? (Global/Local) ve Hangi modellerde çalışıyor? (Agnostic/Specific).\n\n"
        "Bizim çalışmamızda yüksek doğruluklu LightGBM ağaçlarını korumak istediğimiz için 'Post-hoc', hem genel veri setini hem "
        "tekil üniversite programlarını açıklamak istediğimiz için 'Global + Local', ve en önemlisi saniyeler içinde binlerce programı "
        "gecikmesiz hesaplayabilmek için 'Model-Specific TreeSHAP' eksenini tercih ettik."
    )

    # ==========================================================================
    # SLAYT 6: Özellik Önemi (Feature Importance)
    # ==========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    apply_slide_background(s6)
    add_slide_header(s6, "Kullanılan Yöntemler • 01", "Özellik Önemi (Feature Importance) & Hiyerarşi", 
                     "Modelin tahmin gücünü oluşturan 4 temel özniteliğin küresel ve yerel etki ağırlıkları.")

    # Sol: 4 Özellik Kutusu
    add_card(s6, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.9))
    tb_f = s6.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(5.2), Inches(4.5))
    tf_f = tb_f.text_frame
    tf_f.word_wrap = True

    p = tf_f.paragraphs[0]
    p.text = "Modelimizde Kullanılan 4 Ana Öznitelik"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_WHITE
    p.space_after = Pt(10)

    feats = [
        ("1. previous_closing_rank", "Son Yıl Taban Sıralaması (~%78)", "Programın geçmiş yıldaki taban sırası. Üniversitenin marka değeri, şehir çekiciliği ve akademik prestijinin birikimli göstergesidir."),
        ("2. published_quota", "Kontenjan Hacmi (~%12)", "Bölümün kabul ettiği toplam öğrenci adedi. Yüksek kontenjanlı bölümler dalgalanmalara karşı daha istikrarlıdır."),
        ("3. quota_change_pct", "Kontenjan Değişim Yüzdesi (~%6)", "Kontenjandaki ani artış veya daralmanın yarattığı esneme/rekabet baskısı (Laplace yumuşatması k=10 uygulanmıştır)."),
        ("4. rank_momentum_ratio", "Sıralama Trend İvmesi (~%4)", "Bölümün son 3 yıldaki popülarite artışı veya gevşeme ivmesi (Rank_t-1 / Rank_t-2).")
    ]
    for code, title, desc in feats:
        p = tf_f.add_paragraph()
        p.text = f"{code} — {title}"
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = COLOR_EMERALD if "%78" in title else COLOR_CYAN
        p = tf_f.add_paragraph()
        p.text = desc
        p.font.size = Pt(8.8)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.space_after = Pt(6)

    # Sağ: Bar Dağılımı ve Bulgular
    add_card(s6, Inches(6.8), Inches(1.8), Inches(5.7), Inches(4.9))
    tb_fb = s6.shapes.add_textbox(Inches(7.0), Inches(2.0), Inches(5.3), Inches(4.5))
    tf_fb = tb_fb.text_frame
    tf_fb.word_wrap = True

    p = tf_fb.paragraphs[0]
    p.text = "Küresel Öznitelik Önemi (Feature Gain Dağılımı)"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_CYAN
    p.space_after = Pt(14)

    bars = [
        ("Geçmiş Taban Sıralaması", "78.4%", "████████████████████████████████████████"),
        ("Kontenjan Büyüklüğü", "11.8%", "██████"),
        ("Kontenjan Değişim Oranı (Δ%)", "5.9%", "███"),
        ("Sıralama Trend İvmesi (Momentum)", "3.9%", "██")
    ]
    for b_lbl, b_pct, b_bar in bars:
        p = tf_fb.add_paragraph()
        p.text = f"{b_lbl} ({b_pct})"
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEXT_WHITE
        p = tf_fb.add_paragraph()
        p.text = b_bar
        p.font.name = FONT_CODE
        p.font.size = Pt(9.5)
        p.font.color.rgb = COLOR_EMERALD if "78.4" in b_pct else COLOR_CYAN
        p.space_after = Pt(8)

    p = tf_fb.add_paragraph()
    p.text = "💡 Akademik Bulgumuz:"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_EMERALD
    p.space_after = Pt(4)
    p = tf_fb.add_paragraph()
    p.text = "Taban sıralaması ana omurgayı belirlerken (%78), kontenjan değişimleri ve ivme özellikleri özellikle sınırda olan öğrencilerin kazanma olasılığını belirleyen kritik kırılma noktalarını oluşturmaktadır."
    p.font.size = Pt(9.5)
    p.font.color.rgb = COLOR_TEXT_MUTED

    add_speaker_notes(s6, 
        "Modelimizin girdi katmanında rastgele yüzlerce değişken kullanmak yerine, literatüre uygun olarak nedensel ilişkisi olan "
        "4 temel öznitelik tasarladık. Veri setimizde 13.581 lisans programının son 3 yılı incelendi.\n\n"
        "Grafikte görüldüğü üzere model kararlarının yaklaşık %78'ini geçmiş yıl taban sırasından almaktadır. "
        "Ancak asıl katma değer diğer üç özellikte yatmaktadır: Kontenjan daralması veya bölümün son yıllarda popülerleşmesi (momentum), "
        "sıralamanın geçen yıldan sapmasını sağlayan ana etkenlerdir."
    )

    # ==========================================================================
    # SLAYT 7: TreeSHAP & Waterfall
    # ==========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    apply_slide_background(s7)
    add_slide_header(s7, "Kullanılan Yöntemler • 02", "TreeSHAP: Oyun Teorisi & Kesin Toplamsallık", 
                     "Shapley Additive exPlanations teorisi ve model tahminlerinin nedensel bileşenlerine ayrıştırılması.")

    # Sol: Matematiksel Zemin
    add_card(s7, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.9))
    tb_sh = s7.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(5.2), Inches(4.5))
    tf_sh = tb_sh.text_frame
    tf_sh.word_wrap = True

    p = tf_sh.paragraphs[0]
    p.text = "Matematiksel Zemin: Shapley Formülasyonu"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_WHITE
    p.space_after = Pt(8)

    p = tf_sh.add_paragraph()
    p.text = "Lloyd Shapley (1953 Nobel Ödülü) formülasyonu, her özniteliğin model tahminine yaptığı marjinal katkıyı adil biçimde hesaplar:"
    p.font.size = Pt(9.5)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.space_after = Pt(8)

    p = tf_sh.add_paragraph()
    p.text = "φ_i(x) = Σ [|S|!(|F| - |S| - 1)! / |F|!] * [f(S ∪ {i}) - f(S)]"
    p.font.name = FONT_CODE
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = COLOR_AMBER
    p.space_after = Pt(12)

    p = tf_sh.add_paragraph()
    p.text = "Aksiyomatik Garantiler (TreeSHAP Neden Üstündür?):"
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = COLOR_EMERALD
    p.space_after = Pt(4)

    sh_axioms = [
        ("1. Kesin Toplamsallık (Additivity):", "Baz değer ile öznitelik katkılarının toplamı kesinlikle nihai tahmini verir: ŷ = φ_0 + Σ φ_i"),
        ("2. Tutarlılık (Consistency):", "Bir özniteliğin marjinal etkisi artarsa, Shapley değeri asla düşemez."),
        ("3. Polinomiyal Hız:", "Lundberg et al. (2020) TreeSHAP algoritması üssel süreyi O(TLD²) polinomiyal hızına indirir.")
    ]
    for ah, ad in sh_axioms:
        p = tf_sh.add_paragraph()
        p.text = f"• {ah}"
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEXT_WHITE
        p = tf_sh.add_paragraph()
        p.text = f"   {ad}"
        p.font.size = Pt(9)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.space_after = Pt(4)

    # Sağ: Doğrulanmış Waterfall Ayrıştırması
    add_card(s7, Inches(6.8), Inches(1.8), Inches(5.7), Inches(4.9), border_color=COLOR_EMERALD)
    tb_wf = s7.shapes.add_textbox(Inches(7.0), Inches(2.0), Inches(5.3), Inches(4.5))
    tf_wf = tb_wf.text_frame
    tf_wf.word_wrap = True

    p = tf_wf.paragraphs[0]
    p.text = "Doğrulanmış SHAP Waterfall (Şelale) Ayrıştırması"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_CYAN
    p.space_after = Pt(6)

    p = tf_wf.add_paragraph()
    p.text = "Örnek Program: Ege Üniversitesi Bilgisayar Mühendisliği (İngilizce - SAY)"
    p.font.size = Pt(9)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.space_after = Pt(10)

    steps = [
        ("Başlangıç Referans Değeri (φ_0) [SAY Ortalaması]", "97.450 sıra", COLOR_TEXT_WHITE),
        ("Geçmiş Taban Sırası Katkısı (φ_1 - Yerleşik Talep)", "-58.210 sıra öne", COLOR_EMERALD),
        ("Kontenjan Hacmi Katkısı (φ_2 - Kapasite)", "+1.420 sıra geri", COLOR_ROSE),
        ("Sıralama Trend İvmesi Katkısı (φ_3 - İlgi Artışı)", "-1.709 sıra öne", COLOR_EMERALD),
        ("2026 Model Projeksiyon Taban Sırası (ŷ)", "38.951 sıra", COLOR_CYAN)
    ]
    for s_lbl, s_val, s_col in steps:
        p = tf_wf.add_paragraph()
        p.text = f"▶ {s_lbl}"
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEXT_WHITE
        p = tf_wf.add_paragraph()
        p.text = f"    {s_val}"
        p.font.name = FONT_CODE
        p.font.size = Pt(10.5)
        p.font.bold = True
        p.font.color.rgb = s_col
        p.space_after = Pt(4)

    p = tf_wf.add_paragraph()
    p.text = "✓ Matematiksel Doğrulama (Hata = 0.00):"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = COLOR_EMERALD
    p = tf_wf.add_paragraph()
    p.text = "97.450 - 58.210 + 1.420 - 1.709 = 38.951 (Toplamsallık Kuralı Doğrulandı)"
    p.font.name = FONT_CODE
    p.font.size = Pt(9.5)
    p.font.color.rgb = COLOR_TEXT_WHITE

    add_speaker_notes(s7, 
        "Sunumumuzun en önemli metodolojik slaytı burasıdır. XAI literatüründe birçok yöntem yaklaşıktır; "
        "ancak SHAP'ı diğerlerinden ayıran en büyük güç matematiksel aksiyomlarıdır. Özellikle 'Efficiency' yani Toplamsallık kuralı sayesinde, "
        "baz değer olan 97.450'ye tüm özellikleri eklediğimizde tamı tamına 38.951 tahminine ulaşırız.\n\n"
        "Sağdaki şelale diyagramı sistemimizin her bir program için ürettiği gerçek çıktıdır. Öğrenci veya araştırmacı bu şemaya baktığında, "
        "bölümün neden 38 bine çekildiğini; geçmiş taban gücünün -58 bin çektiğini, kontenjanın biraz rahatlattığını ama trend ivmesinin "
        "sıralamayı daha da öne ittiğini açıkça görür."
    )

    # ==========================================================================
    # SLAYT 8: Karşı-Olgusal Açıklamalar & What-If
    # ==========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    apply_slide_background(s8)
    add_slide_header(s8, "Kullanılan Yöntemler • 03", "Karşı-Olgusal Açıklamalar (Counterfactuals) & What-If", 
                     "'Girdi şöyle olsaydı sonuç nasıl değişirdi?' sorusuna yanıt veren eyleme dönük XAI yöntemi.")

    # Sol: Karşı-Olgusal Teori
    add_card(s8, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.9))
    tb_cf = s8.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(5.2), Inches(4.5))
    tf_cf = tb_cf.text_frame
    tf_cf.word_wrap = True

    p = tf_cf.paragraphs[0]
    p.text = "🔮 Karşı-Olgusal Düşünme Nedir?"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_CYAN
    p.space_after = Pt(8)

    p = tf_cf.add_paragraph()
    p.text = "Wachter et al. (2017) tarafından literatüre kazandırılan Karşı-Olgusal Açıklamalar; modelin iç yapısını bilmeye gerek kalmadan, sonucu istenen hedefe (y*) ulaştırmak için girdide yapılması gereken minimum değişikliği (x ➔ x*) tanımlar:"
    p.font.size = Pt(9.5)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.space_after = Pt(8)

    p = tf_cf.add_paragraph()
    p.text = "arg min_{x*} D(x, x*)   koşul: f(x*) = y*"
    p.font.name = FONT_CODE
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = COLOR_AMBER
    p.space_after = Pt(12)

    cf_points = [
        ("Eyleme Dönük İçgörü (Actionable Recourse): ", "Kullanıcıya sadece mevcut durumu değil, kararın nasıl tersine çevrilebileceğini gösterir."),
        ("Duyarlılık Testi: ", "Tahminin hangi parametreye ne kadar hassas olduğunu kanıtlar."),
        ("Karar Sınırları: ", "'İdeal Hedef', 'Riskli' ve 'Güvenli Liman' arasındaki sınır çizgilerini şeffaf kılar.")
    ]
    for ch, cd in cf_points:
        p = tf_cf.add_paragraph()
        p.text = f"• {ch}{cd}"
        p.font.size = Pt(9.2)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.space_after = Pt(6)

    # Sağ: Projedeki What-If Uygulaması
    add_card(s8, Inches(6.8), Inches(1.8), Inches(5.7), Inches(4.9))
    tb_cs = s8.shapes.add_textbox(Inches(7.0), Inches(2.0), Inches(5.3), Inches(4.5))
    tf_cs = tb_cs.text_frame
    tf_cs.word_wrap = True

    p = tf_cs.paragraphs[0]
    p.text = "⚡ Projedeki Uygulama: Kontenjan Simülatörü"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_EMERALD
    p.space_after = Pt(10)

    sim_scenarios = [
        ("Senaryo A (Baz Durum - 60 Kişi):", "Tahmin: 38.951 | 42.000 sıralamalı aday için: İDEAL HEDEF"),
        ("Senaryo B (Kontenjan +30 Artarsa - 90 Kişi):", "Tahmin: 47.201 (+8.250 sıra esneme) | Aday için: GÜVENLİ LİMAN (Daha Kolay Giriş)"),
        ("Senaryo C (Kontenjan -20 Azalırsa - 40 Kişi):", "Tahmin: 33.151 (-5.800 sıra öne çekme) | Aday için: DAHA REKABETÇİ (Riskli / Hayal)")
    ]
    for s_title, s_res in sim_scenarios:
        p = tf_cs.add_paragraph()
        p.text = s_title
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEXT_WHITE
        p = tf_cs.add_paragraph()
        p.text = s_res
        p.font.size = Pt(9.2)
        p.font.color.rgb = COLOR_EMERALD if "GÜVENLİ" in s_res else (COLOR_ROSE if "REKABETÇİ" in s_res else COLOR_CYAN)
        p.space_after = Pt(8)

    p = tf_cs.add_paragraph()
    p.text = "💡 Simülasyon Çıkarımı:"
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = COLOR_AMBER
    p = tf_cs.add_paragraph()
    p.text = "Aday kontenjan değişiminin sıralamayı nasıl etkileyeceğini anında simüle ederek tercih listesini olası YÖK kontenjan güncellemelerine karşı güvene alır."
    p.font.size = Pt(9.2)
    p.font.color.rgb = COLOR_TEXT_MUTED

    add_speaker_notes(s8, 
        "Karşı-olgusal açıklamalar, psikolojideki 'keşke şöyle olsaydı ne olurdu' mantığının yapay zekâya uyarlanmış halidir. "
        "Bir adaya yalnızca 'puanın yetmiyor' demek eylemsizlik yaratır. Ancak 'Bu bölümün kontenjanı 20 kişi artarsa sıralaması "
        "44 bine geriler ve senin sıralamanla güvenli limana girer' demek, adaya senaryo analizi yapma imkânı verir.\n\n"
        "Sağ tarafta gördüğünüz simülatör, sistemimizde canlı olarak çalışan Kontenjan Simülatörünün karşı-olgusal çıkarım modelidir."
    )

    # ==========================================================================
    # SLAYT 9: Karşılaştırmalı Yöntem Analizi (XAI Benchmark)
    # ==========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    apply_slide_background(s9)
    add_slide_header(s9, "Metodolojik Analiz • 04", "XAI Yöntemlerinin Karşılaştırmalı Değerlendirmesi", 
                     "Literatürdeki başlıca açıklanabilirlik teknikleri ve projemizdeki seçim gerekçeleri.")

    # Tablo Ekleme
    rows, cols = 6, 6
    tbl_shape = s9.shapes.add_table(rows, cols, Inches(0.8), Inches(1.8), Inches(11.733), Inches(3.2))
    tbl = tbl_shape.table

    tbl.columns[0].width = Inches(2.3)
    tbl.columns[1].width = Inches(1.8)
    tbl.columns[2].width = Inches(2.2)
    tbl.columns[3].width = Inches(1.8)
    tbl.columns[4].width = Inches(1.8)
    tbl.columns[5].width = Inches(1.833)

    headers = ["Yöntem", "Veri Türü", "Teorik Dayanak", "Toplamsallık", "Hesaplama Hızı", "Projede Durumu"]
    for j, h in enumerate(headers):
        cell = tbl.cell(0, j)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = RGBColor(15, 23, 42)
        p = cell.text_frame.paragraphs[0]
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEXT_WHITE

    table_data = [
        ("TreeSHAP", "Tabüler / Ağaç", "İşbirlikçi Oyun Teorisi", "✓ Kesin (Exact)", "Çok Hızlı O(TLD²)", "✅ BİRİNCİL MOTOR"),
        ("Counterfactual (What-If)", "Tabüler / Çoklu", "Nedensel Optimizasyon", "Uygulanamaz", "Anlık (Milisaniye)", "✅ SİMÜLATÖR"),
        ("LIME", "Tabüler, Metin, Görsel", "Yerel Perturbasyon", "✗ Yok (Rassal)", "Orta (Örnekleme)", "❌ ELENDİ"),
        ("Partial Dep. (PDP)", "Tabüler / Sürekli", "Marjinal Beklenti", "Uygulanamaz", "Yavaş (Tüm Veri)", "❌ ELENDİ"),
        ("Grad-CAM", "Görsel (CNN / Vision)", "Gradyan Aktivasyon", "Uygulanamaz", "Hızlı", "❌ KAPSAM DIŞI")
    ]
    for i, row in enumerate(table_data):
        for j, val in enumerate(row):
            cell = tbl.cell(i + 1, j)
            cell.text = val
            cell.fill.solid()
            cell.fill.fore_color.rgb = RGBColor(16, 26, 48) if "BİRİNCİL" in row[5] or "SİMÜLATÖR" in row[5] else RGBColor(10, 16, 30)
            p = cell.text_frame.paragraphs[0]
            p.font.size = Pt(9)
            if j == 0:
                p.font.bold = True
                p.font.color.rgb = COLOR_TEXT_WHITE
            elif "BİRİNCİL" in val or "SİMÜLATÖR" in val:
                p.font.bold = True
                p.font.color.rgb = COLOR_EMERALD
            elif "ELENDİ" in val or "KAPSAM" in val:
                p.font.color.rgb = COLOR_ROSE
            else:
                p.font.color.rgb = COLOR_TEXT_MUTED

    # Alt Gerekçe Kutuları
    rationale = [
        ("Neden LIME Değil TreeSHAP?", "LIME her çalıştığında rassal yapay veri ürettiği için aynı veri noktasına farklı açıklamalar üretebilir (Non-deterministic). TreeSHAP ise deterministiktir ve matematiksel kesin toplamsallık sunar."),
        ("Neden Grad-CAM Kullanılmadı?", "Grad-CAM görüntü piksellerindeki evrişim katmanlarını analiz eder. Üniversite tercih verisi sayısal/tabüler nitelikte olduğu için teorik olarak Grad-CAM bu probleme uygulanamaz."),
        ("Neden PDP Yerine What-If?", "PDP sadece ortalama genel eğilimi verir ve tekil adayın özgül koşullarını kaçırır. What-If simülatörü adayın tek bir program üzerindeki karar sınırını test etmesine imkan tanır.")
    ]
    r_w = Inches(3.7)
    r_gap = Inches(0.26)
    for i, (r_title, r_desc) in enumerate(rationale):
        r_left = Inches(0.8) + i * (r_w + r_gap)
        add_card(s9, r_left, Inches(5.3), r_w, Inches(1.7))
        tb_r = s9.shapes.add_textbox(r_left + Inches(0.12), Inches(5.35), r_w - Inches(0.24), Inches(1.5))
        tf_r = tb_r.text_frame
        tf_r.word_wrap = True

        p = tf_r.paragraphs[0]
        p.text = r_title
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = COLOR_CYAN
        p.space_after = Pt(2)

        p = tf_r.add_paragraph()
        p.text = r_desc
        p.font.size = Pt(8.5)
        p.font.color.rgb = COLOR_TEXT_MUTED

    add_speaker_notes(s9, 
        "Bu slayt, çalışmamızın metodolojik tutarlılığını savunan kritik bir karşılaştırma tablosudur. XAI literatüründe popüler olan 5 temel tekniği karşılaştırdık.\n\n"
        "Görüldüğü üzere, LIME rassal örnekleme yaptığı için jüri veya denetçi karşısında aynı öğrenciye farklı iki açıklama üretme riskine sahiptir. "
        "Grad-CAM ise görsel modellere hastır. Bu nedenle tabüler veride dünya standardı olan TreeSHAP ve kullanıcı deneyiminde en güçlü "
        "eyleme dönük karşılığı olan Counterfactual (What-If) ikilisi çalışmamızın omurgasını oluşturmuştur."
    )

    # ==========================================================================
    # SLAYT 10: Uygulama Örneği: YKS Tercih Asistanı
    # ==========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    apply_slide_background(s10)
    add_slide_header(s10, "Uygulama Örneği • 01", "Gerçek Dünya Uygulaması: YKS Tercih Asistanı", 
                     "Açıklanabilir yapay zekânın merkezi üniversite yerleştirmelerinde bir karar destek sistemi olarak hayata geçirilmesi.")

    # Sol: Problem & Çözüm
    add_card(s10, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.9))
    tb_u = s10.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(5.2), Inches(4.5))
    tf_u = tb_u.text_frame
    tf_u.word_wrap = True

    p = tf_u.paragraphs[0]
    p.text = "🎯 Projenin Amacı ve Çözülen Problem"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_WHITE
    p.space_after = Pt(6)

    p = tf_u.add_paragraph()
    p.text = "Türkiye'de her yıl 3 milyondan fazla aday YKS sınavına girmekte ve merkezi sistemde 24 tercih hakkını kullanarak geleceğini şekillendirmektedir."
    p.font.size = Pt(9.5)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.space_after = Pt(10)

    p = tf_u.add_paragraph()
    p.text = "Mevcut Durumdaki Kritik Sorunlar:"
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = COLOR_ROSE
    p.space_after = Pt(2)

    u_probs = [
        "13.581 Lisans Programı: Devasa veri havuzunda adayların kaybolması ve bilgi asimetrisi.",
        "Dinamik Kontenjan & Talep Dalgalanmaları: Sadece geçen yılın puanına bakarak tercih yapmanın yarattığı açıkta kalma veya ölü tercih riski.",
        "Kara Kutu Danışmanlık: 'Burası gelir' diyen ama hiçbir nedensel dayanak sunamayan klasik yapay zekâ botlarının güvensizliği."
    ]
    for up in u_probs:
        p = tf_u.add_paragraph()
        p.text = f"• {up}"
        p.font.size = Pt(8.8)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.space_after = Pt(4)

    p = tf_u.add_paragraph()
    p.text = "Geliştirilen XAI Çözümü:"
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = COLOR_EMERALD
    p.space_after = Pt(2)

    p = tf_u.add_paragraph()
    p.text = "Öğrencinin puanına ve profiline göre 13.581 programı tarayan, 2026 taban sıralamasını öngören, arkasındaki nedenleri TreeSHAP ile ayrıştıran, %80 güven koridoru sunan şeffaf platform."
    p.font.size = Pt(9)
    p.font.color.rgb = COLOR_TEXT_WHITE

    # Sağ: Sistem Kapsamı & İstatistikler
    add_card(s10, Inches(6.8), Inches(1.8), Inches(5.7), Inches(4.9))
    tb_us = s10.shapes.add_textbox(Inches(7.0), Inches(2.0), Inches(5.3), Inches(4.5))
    tf_us = tb_us.text_frame
    tf_us.word_wrap = True

    p = tf_us.paragraphs[0]
    p.text = "Sistem Kapsamı ve Veri Altyapısı"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_CYAN
    p.space_after = Pt(12)

    stats = [
        ("13.581 Program", "Türkiye geneli tüm devlet, vakıf ve KKTC lisans programları"),
        ("81 İl + KKTC", "Bölgesel yaşam maliyeti ve yurt kapasitesi entegrasyonu"),
        ("4 Puan Türü", "SAY, EA, SÖZ, DİL için 4 bağımsız eğitilmiş model"),
        ("3 Yıllık Trend", "2023, 2024 ve 2025 resmi ÖSYM yerleştirme verileri")
    ]
    for s_num, s_sub in stats:
        p = tf_us.add_paragraph()
        p.text = f"▶ {s_num}"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = COLOR_EMERALD
        p = tf_us.add_paragraph()
        p.text = f"    {s_sub}"
        p.font.size = Pt(9)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.space_after = Pt(6)

    p = tf_us.add_paragraph()
    p.text = "🛡️ Etik XAI Prensibi:"
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = COLOR_AMBER
    p = tf_us.add_paragraph()
    p.text = "Sistem asla öğrenciden gizli kural yürütmez. Her tahmin; Geçmiş Taban İstikrarı, Kontenjan Değişimi ve Talep İvmesi olmak üzere üç şeffaf faktör üzerinden açıklanır."
    p.font.size = Pt(9)
    p.font.color.rgb = COLOR_TEXT_MUTED

    add_speaker_notes(s10, 
        "Sunumumuzun ikinci ana bölümüne, yani geliştirdiğimiz 'YKS Tercih Asistanı' uygulamasına geçiyoruz. "
        "Bu proje bir oyuncak veri seti üzerinde değil; Türkiye genelindeki 81 il ve KKTC'yi kapsayan 13.581 resmi lisans programı üzerinde çalışmaktadır.\n\n"
        "Çözdüğümüz temel problem, üniversite tercihlerinde yaşanan bilgi kirliliği ve tercih hatalarıdır. Geleneksel yapay zekâ "
        "sistemleri adaya 'Hacettepe Bilgisayar gelir' diyerek öğrenciyi yanıltabilirken, bizim sistemimiz her tahminin arkasındaki "
        "koridoru ve faktörleri açıklayarak adayın riskini minimize eder."
    )

    # ==========================================================================
    # SLAYT 11: Sistem Mimarisi & Uçtan Uca XAI Hattı
    # ==========================================================================
    s11 = prs.slides.add_slide(blank_layout)
    apply_slide_background(s11)
    add_slide_header(s11, "Uygulama Örneği • 02", "Sistem Mimarisi & Uçtan Uca XAI Hattı", 
                     "Veri yüklemeden model çıkarımına, SHAP hesaplamasından doğal dil üretimine çok katmanlı mimari.")

    arch_layers = [
        ("KATMAN 1: VERİ & İNDEKSLEME", "13.581 Lisans Programı (ÖSYM Açık Verisi) • 2023-2025 Taban Sıraları & Kontenjanlar • 81 İl Yaşam Maliyeti"),
        ("KATMAN 2: TAHMİN & ÇIKARIM", "LightGBM Medyan Regresyonu (L1) • Quantile Regresyon (%10 & %90 Sınırları) • SAY, EA, SÖZ, DİL Bağımsız Modelleri"),
        ("KATMAN 3: AÇIKLANABİLİRLİK (XAI)", "TreeSHAP Decomposition (4 Özellik) • Toplamsallık Doğrulama (ŷ = φ_0 + Σ φ_i) • What-If Kontenjan Simülatörü"),
        ("KATMAN 4: ARAYÜZ & DOĞAL DİL", "İnteraktif React UI (Harita, Trend Borsası, Simülatör) • Açılır Gerekçe Çekmecesi • Doğal Rehber Danışmanı (GPT-4o-mini)")
    ]

    for i, (l_title, l_desc) in enumerate(arch_layers):
        l_top = Inches(1.8) + i * Inches(1.25)
        is_highlight = "KATMAN 3" in l_title
        add_card(s11, Inches(0.8), l_top, Inches(11.733), Inches(1.05),
                 bg_color=RGBColor(16, 32, 55) if is_highlight else COLOR_CARD_BG,
                 border_color=COLOR_EMERALD if is_highlight else COLOR_CARD_BORDER)
        
        tb_l = s11.shapes.add_textbox(Inches(1.0), l_top + Inches(0.12), Inches(11.333), Inches(0.8))
        tf_l = tb_l.text_frame
        tf_l.word_wrap = True

        p = tf_l.paragraphs[0]
        p.text = l_title
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = COLOR_EMERALD if is_highlight else COLOR_CYAN
        p.space_after = Pt(2)

        p = tf_l.add_paragraph()
        p.text = l_desc
        p.font.size = Pt(9.5)
        p.font.color.rgb = COLOR_TEXT_WHITE if is_highlight else COLOR_TEXT_MUTED

    add_speaker_notes(s11, 
        "Mimari şemamız sistemin üretim ortamındaki 4 katmanını net biçimde göstermektedir. Sistemimiz FastAPI tabanlı mikroservis mantığıyla çalışmaktadır.\n\n"
        "Dikkat edilmesi gereken en önemli nokta 3. Katmandır. Model çıkarım yaptıktan hemen sonra çıktı ham haliyle kullanıcıya iletilmez. "
        "TreeSHAP motoru anlık olarak şelale adımlarını hesaplar, matematiksel toplamsallığı doğrular, ardından 4. Katmandaki hem görsel arayüze "
        "hem de doğal dil rehberlik botuna bu gerekçeleri besler."
    )

    # ==========================================================================
    # SLAYT 12: Arayüz Entegrasyonu & Ekran Çıktıları
    # ==========================================================================
    s12 = prs.slides.add_slide(blank_layout)
    apply_slide_background(s12)
    add_slide_header(s12, "Uygulama Örneği • 03", "Arayüz Entegrasyonu & Gerçek Ekran Çıktıları", 
                     "Öğrenci arayüzünde teknik terim karmaşasından uzak, şeffaf karar kartları ve akıllı rehberlik.")

    components = [
        ("BİLEŞEN 1", "Program Karar Kartı", [
            ("Üniversite / Bölüm:", "Ege Üniversitesi - Bilgisayar Müh. (İng.)"),
            ("2025 Son Taban Sırası:", "40.120"),
            ("2026 Beklenen Sıralama:", "38.951"),
            ("Güvenli Tercih Aralığı:", "35.800 – 42.100 (±%8.1)"),
            ("Aday Durumu:", "Sıralamana Yakın / İdeal Hedef"),
            ("Belirleyici Neden:", "Bölümün Yerleşik Talebi & Taban Gücü")
        ]),
        ("BİLEŞEN 2", "Gerekçe Analizi (Çekmece)", [
            ("Yerleşik Talep:", "Geçmiş yıl 40.120 taban sırası en baskın belirleyicidir."),
            ("Kontenjan Baskısı:", "Kontenjanda değişim olmaması sıralama istikrarını korur."),
            ("Talep İvmesi:", "Son 3 yıllık ilgi artışı sıralamayı 1.200 sıra öne itmektedir."),
            ("Doğal Dil:", "Formüller yerine adayın anlayacağı rehberlik gerekçeleri sunulur.")
        ]),
        ("BİLEŞEN 3", "Doğal Rehberlik Danışmanı", [
            ("Öğrenci Sorusu:", "'Sayısal 45.000 ile Ege Bilgisayar gelir mi?'"),
            ("AI Danışman Yanıtı:", "'2026 beklentisi 38.951'dir (Aralık: 35.800-42.100). Üst hedef olarak ilk sıralara yazabilirsin; ancak listeni riske atmamak için Marmara ve Başkent ile desteklemelisin.'"),
            ("RAG Entegrasyonu:", "Model çıktıları kör kutu olmadan doğrudan chat cevabına aktarılır.")
        ])
    ]

    c_w = Inches(3.7)
    c_gap = Inches(0.26)
    for i, (b_tag, b_title, b_items) in enumerate(components):
        c_left = Inches(0.8) + i * (c_w + c_gap)
        add_card(s12, c_left, Inches(1.8), c_w, Inches(4.9))
        tb_c = s12.shapes.add_textbox(c_left + Inches(0.12), Inches(1.95), c_w - Inches(0.24), Inches(4.5))
        tf_c = tb_c.text_frame
        tf_c.word_wrap = True

        p = tf_c.paragraphs[0]
        p.text = b_tag
        p.font.size = Pt(8.5)
        p.font.bold = True
        p.font.color.rgb = COLOR_CYAN
        p.space_after = Pt(2)

        p = tf_c.add_paragraph()
        p.text = b_title
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEXT_WHITE
        p.space_after = Pt(8)

        for kh, kd in b_items:
            p = tf_c.add_paragraph()
            p.text = kh
            p.font.size = Pt(9)
            p.font.bold = True
            p.font.color.rgb = COLOR_EMERALD if "2026" in kh or "AI Danışman" in kh else COLOR_TEXT_WHITE
            p = tf_c.add_paragraph()
            p.text = kd
            p.font.size = Pt(8.5)
            p.font.color.rgb = COLOR_TEXT_MUTED
            p.space_after = Pt(4)

    add_speaker_notes(s12, 
        "Burada geliştirdiğimiz arayüzün üç temel bileşenini görüyoruz. İlk bileşende karar kartı bulunmaktadır; "
        "burada LightGBM veya TreeSHAP gibi teknik kelimeler yerine öğrenci dostu '2026 Beklenen Sıralama' ve "
        "'Güvenli Tercih Aralığı' ifadeleri yer alır.\n\n"
        "İkinci bileşende açılır çekmece ile kararın arkasındaki gerekçeler sunulur. Üçüncü bileşende ise entegre sohbet danışmanı "
        "devreye girerek öğrencinin özel başarı sırasına göre 24'lük tercih listesi stratejisi oluşturur."
    )

    # ==========================================================================
    # SLAYT 13: Ampirik Model Doğrulaması & Performans Bulguları
    # ==========================================================================
    s13 = prs.slides.add_slide(blank_layout)
    apply_slide_background(s13)
    add_slide_header(s13, "Uygulama Örneği • 04", "Ampirik Model Doğrulaması & Performans Bulguları", 
                     "7.811 aktif lisans programı üzerinde kör test ile ölçülen gerçek akademik doğruluk metrikleri.")

    # Sol: Doğrulama Tablosu
    add_card(s13, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.9))
    tb_ev = s13.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(5.2), Inches(4.5))
    tf_ev = tb_ev.text_frame
    tf_ev.word_wrap = True

    p = tf_ev.paragraphs[0]
    p.text = "Puan Türlerine Göre Model Başarı Metrikleri (MAE)"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_WHITE
    p.space_after = Pt(6)

    p = tf_ev.add_paragraph()
    p.text = "2024 verileriyle eğitilen modeller, 2025 resmi sonuçları üzerinde kör teste tabi tutulmuştur:"
    p.font.size = Pt(9)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.space_after = Pt(10)

    eval_rows = [
        ("SAY (Sayısal - 3.205 Prog.)", "Geçmiş MAE: 60.396 | Model: 61.253", "Dengeli Taban İstikrarı (~%0)"),
        ("EA (Eşit Ağırlık - 2.726 Prog.)", "Geçmiş MAE: 158.817 | Model: 125.072", "+%21,25 HATA AZALMASI"),
        ("SÖZ (Sözel - 1.391 Prog.)", "Geçmiş MAE: 79.005 | Model: 61.767", "+%21,82 HATA AZALMASI"),
        ("DİL (Yabancı Dil - 489 Prog.)", "Geçmiş MAE: 10.621 | Model: 9.241", "+%13,00 HATA AZALMASI")
    ]
    for st_title, st_mae, st_gain in eval_rows:
        p = tf_ev.add_paragraph()
        p.text = f"▶ {st_title}"
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEXT_WHITE
        p = tf_ev.add_paragraph()
        p.text = f"    {st_mae}"
        p.font.size = Pt(8.5)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p = tf_ev.add_paragraph()
        p.text = f"    Kazanç: {st_gain}"
        p.font.size = Pt(9)
        p.font.bold = True
        p.font.color.rgb = COLOR_EMERALD if "%21" in st_gain or "%13" in st_gain else COLOR_TEXT_DIM
        p.space_after = Pt(6)

    p = tf_ev.add_paragraph()
    p.text = "Genel Toplam (7.811 Program): Baseline MAE = 94.942 ➔ Model MAE = 80.361 (%15,36 Hata Azalması)"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = COLOR_EMERALD

    # Sağ: Akademik Çıkarımlar
    add_card(s13, Inches(6.8), Inches(1.8), Inches(5.7), Inches(4.9))
    tb_ei = s13.shapes.add_textbox(Inches(7.0), Inches(2.0), Inches(5.3), Inches(4.5))
    tf_ei = tb_ei.text_frame
    tf_ei.word_wrap = True

    p = tf_ei.paragraphs[0]
    p.text = "Akademik Çıkarımlar & Değerlendirme"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_CYAN
    p.space_after = Pt(10)

    eval_insights = [
        ("EA ve SÖZ Alanlarında %21'i Aşan Başarı: ", "Eşit Ağırlık ve Sözelde kontenjan dalgalanmaları çok şiddetli olduğu için geleneksel geçmiş yıl yöntemi 158 bin sıra hata yaparken, modelimiz bu hatayı 125 bine indirmiştir."),
        ("Sayısal Alanda Yüksek Taban İstikrarı: ", "Tıp ve köklü mühendisliklerde taban sıraları çok oturmuş olduğundan model aşırı tahmin üretmeyerek geçmiş taban istikrarını korumuştur."),
        ("Quantile Güven Aralığı Güvenilirliği: ", "Modellerimizin ürettiği %10 - %90 güven koridorları, gerçekleşen 2025 sınav sonuçlarının ortalama %55-60'ını doğrudan başarı bandı içerisine almıştır.")
    ]
    for eh, ed in eval_insights:
        p = tf_ei.add_paragraph()
        p.text = f"• {eh}"
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEXT_WHITE
        p = tf_ei.add_paragraph()
        p.text = f"   {ed}"
        p.font.size = Pt(9.2)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.space_after = Pt(8)

    add_speaker_notes(s13, 
        "Bu slayt çalışmamızın somut ampirik kanıtıdır. Projemizde tahmini rakamlar değil, 7.811 aktif lisans programı "
        "üzerinde ölçülmüş resmi test sonuçları bulunmaktadır.\n\n"
        "Özellikle Eşit Ağırlık ve Sözel alanlarında elde ettiğimiz %21'lik hata azalması çok büyüktür. Hukuk, Psikoloji veya "
        "İİBF gibi bölümlerde kontenjan değişimleri çok yüksek olduğu için modelimiz geçmiş yıla göre 33 bin sıra daha isabetli "
        "tahmin üretmiştir. Bu da öğrencilerin tercih listelerini oluştururken açıkta kalma riskini doğrudan bertaraf etmektedir."
    )

    # ==========================================================================
    # SLAYT 14: Sonuç, Tartışma, Sınırlılıklar & Bilimsel Kaynakça
    # ==========================================================================
    s14 = prs.slides.add_slide(blank_layout)
    apply_slide_background(s14)
    add_slide_header(s14, "Kapanış • 01", "Sonuç, Tartışma, Sınırlılıklar & Bilimsel Kaynakça", 
                     "Araştırmanın genel sentezi, gelecek çalışmalar ve akademik referanslar.")

    # Sol: Katkılar ve Sınırlılıklar
    add_card(s14, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.9))
    tb_concl = s14.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(5.2), Inches(4.5))
    tf_concl = tb_concl.text_frame
    tf_concl.word_wrap = True

    p = tf_concl.paragraphs[0]
    p.text = "🎯 Temel Katkılar ve Sonuçlar"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_EMERALD
    p.space_after = Pt(6)

    c_points = [
        ("Şeffaflık ile Doğruluk Birleşti: ", "LightGBM'in yüksek tahmin gücü (%15.36 hata azalması) TreeSHAP ile matematiksel olarak şeffaflaştırıldı."),
        ("Eyleme Dönük Karar Desteği: ", "What-If simülatörü adayın pasif bir izleyici yerine senaryo test eden bir karar verici olmasını sağladı."),
        ("İki Katmanlı İletişim: ", "Uzmanlar için matematiksel Shapley adımları; öğrenciler için doğal Türkçe rehberlik dili sunuldu.")
    ]
    for ch, cd in c_points:
        p = tf_concl.add_paragraph()
        p.text = f"• {ch}{cd}"
        p.font.size = Pt(8.8)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.space_after = Pt(4)

    p = tf_concl.add_paragraph()
    p.text = "⚠️ Sınırlılıklar & Gelecek Çalışmalar"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_AMBER
    p.space_after = Pt(4)

    l_points = [
        ("Sosyal Medya Trendleri: ", "Ani popülarite patlamaları geçmiş veride iz bırakmadan gerçekleşebilmektedir; gelecekte sosyal medya duygu analizi eklenebilir."),
        ("Uç Sıralama Varyansı: ", "500.000'den sonraki sıralamalarda yerleşme motivasyonu düzensizleştiği için hata payı büyümektedir.")
    ]
    for lh, ld in l_points:
        p = tf_concl.add_paragraph()
        p.text = f"• {lh}{ld}"
        p.font.size = Pt(8.8)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.space_after = Pt(4)

    # Sağ: Bilimsel Kaynakça
    add_card(s14, Inches(6.8), Inches(1.8), Inches(5.7), Inches(4.9))
    tb_bib = s14.shapes.add_textbox(Inches(7.0), Inches(2.0), Inches(5.3), Inches(4.5))
    tf_bib = tb_bib.text_frame
    tf_bib.word_wrap = True

    p = tf_bib.paragraphs[0]
    p.text = "📚 Bilimsel Kaynakça (Selected References)"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_CYAN
    p.space_after = Pt(8)

    references = [
        "Lundberg, S. M., & Lee, S.-I. (2017). A Unified Approach to Interpreting Model Predictions. NeurIPS 30.",
        "Lundberg, S. M. et al. (2020). From local explanations to global understanding with explainable AI for trees. Nature Machine Intelligence, 2(1), 56-67.",
        "Molnar, C. (2022). Interpretable Machine Learning: A Guide for Making Black Box Models Explainable. 2nd Edition.",
        "Wachter, S., Mittelstadt, B., & Russell, C. (2017). Counterfactual Explanations Without Opening the Black Box. Harvard Journal of Law & Technology.",
        "Ke, G. et al. (2017). LightGBM: A Highly Efficient Gradient Boosting Decision Tree. NeurIPS 30.",
        "Ribeiro, M. T., Singh, S., & Guestrin, C. (2016). 'Why Should I Trust You?': Explaining the Predictions of Any Classifier. ACM SIGKDD."
    ]
    for ref in references:
        p = tf_bib.add_paragraph()
        p.text = f"[{references.index(ref) + 1}] {ref}"
        p.font.size = Pt(8.5)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.space_after = Pt(6)

    p = tf_bib.add_paragraph()
    p.text = "Dinlediğiniz için teşekkür ederim. Sorularınızı yanıtlamaktan memnuniyet duyarım."
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = COLOR_EMERALD

    add_speaker_notes(s14, 
        "Değerli jüri üyeleri, özetlemek gerekirse: Bu çalışmada Açıklanabilir Yapay Zekâ'nın teorik ilkelerini sadece literatür "
        "düzeyinde bırakmayıp, Türkiye'nin en büyük karar destek problemlerinden biri olan YKS tercihleri üzerinde somut bir başarıya dönüştürdük.\n\n"
        "Modelimiz hem matematiksel doğrulukta %15'in üzerinde bir hata indirgemesi sağlamış, hem de TreeSHAP ve Counterfactual Simülatör "
        "sayesinde öğrencilere 'neden' sorusunun tam ve eksiksiz cevabını vermiştir. İlginiz ve sabrınız için teşekkür eder, "
        "sorularınızı memnuniyetle beklerim."
    )

    # Kaydetme
    out_path = os.path.join("presentation", "Aciklanabilir_Yapay_Zeka_XAI_Sunumu.pptx")
    prs.save(out_path)
    print(f"PowerPoint sunumu başarıyla oluşturuldu: {out_path} ({len(prs.slides)} Slayt)")

if __name__ == "__main__":
    create_presentation()
