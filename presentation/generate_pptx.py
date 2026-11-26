# -*- coding: utf-8 -*-
"""
Açıklanabilir Yapay Zekâ (XAI) & YKS Tercih Asistanı — 12 Slaytlık Sade Akademik PowerPoint Üreticisi
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

# Soft Sage & Electric Lime Academic Palette
BG_CANVAS = RGBColor(232, 235, 224)       # #E8EBE0
BG_CARD = RGBColor(240, 241, 233)         # #F0F1E9
BG_HIGHLIGHT = RGBColor(229, 237, 200)    # #E5EDC8
BG_SUBTLE = RGBColor(223, 228, 213)       # #DFE4D5
BORDER_SAGE = RGBColor(208, 213, 198)     # #D0D5C6

TEXT_PRIMARY = RGBColor(23, 26, 18)       # #171A12
TEXT_SECONDARY = RGBColor(107, 112, 101)  # #6B7065
TEXT_OLIVE = RGBColor(82, 107, 25)        # #526B19
ACCENT_LIME = RGBColor(198, 244, 50)      # #C6F432
ACCENT_AMBER = RGBColor(180, 83, 9)       # #B45309


def set_bg(slide):
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = BG_CANVAS


def add_card(slide, left, top, width, height, bg=BG_CARD, border=BORDER_SAGE):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.adjustments[0] = 0.04
    shape.fill.solid()
    shape.fill.fore_color.rgb = bg
    shape.line.color.rgb = border
    shape.line.width = Pt(1)
    return shape


def add_header(slide, tag, title, subtitle):
    tb_tag = slide.shapes.add_textbox(Inches(0.8), Inches(0.42), Inches(11.733), Inches(0.3))
    p = tb_tag.text_frame.paragraphs[0]
    p.text = tag.upper()
    p.font.name = "Calibri"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = TEXT_OLIVE

    tb_t = slide.shapes.add_textbox(Inches(0.8), Inches(0.72), Inches(11.733), Inches(0.5))
    p_t = tb_t.text_frame.paragraphs[0]
    p_t.text = title
    p_t.font.name = "Calibri"
    p_t.font.size = Pt(24)
    p_t.font.bold = True
    p_t.font.color.rgb = TEXT_PRIMARY

    tb_s = slide.shapes.add_textbox(Inches(0.8), Inches(1.22), Inches(11.733), Inches(0.35))
    p_s = tb_s.text_frame.paragraphs[0]
    p_s.text = subtitle
    p_s.font.name = "Calibri"
    p_s.font.size = Pt(12)
    p_s.font.color.rgb = TEXT_SECONDARY


def add_note_box(slide, note_text):
    add_card(slide, Inches(0.8), Inches(5.88), Inches(11.733), Inches(1.18), bg=BG_CARD, border=BORDER_SAGE)
    # Left lime accent strip
    strip = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(5.88), Inches(0.08), Inches(1.18))
    strip.fill.solid()
    strip.fill.fore_color.rgb = TEXT_OLIVE
    strip.line.fill.background()

    tb = slide.shapes.add_textbox(Inches(1.05), Inches(5.96), Inches(11.35), Inches(1.02))
    tf = tb.text_frame
    tf.word_wrap = True

    p1 = tf.paragraphs[0]
    p1.text = "Not:"
    p1.font.name = "Calibri"
    p1.font.size = Pt(8.5)
    p1.font.bold = True
    p1.font.color.rgb = TEXT_OLIVE
    p1.space_after = Pt(3)

    p2 = tf.add_paragraph()
    p2.text = note_text
    p2.font.name = "Calibri"
    p2.font.size = Pt(10.5)
    p2.font.color.rgb = TEXT_PRIMARY

    # Also put into PowerPoint Presenter Notes
    slide.notes_slide.notes_text_frame.text = note_text


def write_card_content(slide, left, top, width, height, tag, title, body_lines, bg=BG_CARD, border=BORDER_SAGE):
    add_card(slide, left, top, width, height, bg=bg, border=border)
    tb = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.16), width - Inches(0.4), height - Inches(0.32))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    if tag:
        p.text = tag
        p.font.name = "Calibri"
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = TEXT_OLIVE
        p.space_after = Pt(4)
        p = tf.add_paragraph()

    p.text = title
    p.font.name = "Calibri"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = TEXT_PRIMARY
    p.space_after = Pt(8)

    for line in body_lines:
        p = tf.add_paragraph()
        p.text = line
        p.font.name = "Calibri"
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_SECONDARY
        p.space_after = Pt(5)


def build_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank = prs.slide_layouts[6]

    # SLAYT 1: KAPAK
    s1 = prs.slides.add_slide(blank)
    set_bg(s1)
    add_card(s1, Inches(0.8), Inches(0.75), Inches(11.733), Inches(4.85), bg=BG_CARD)

    tb = s1.shapes.add_textbox(Inches(1.2), Inches(1.05), Inches(10.9), Inches(2.2))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "AKADEMİK SUNUM"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = TEXT_OLIVE
    p.space_after = Pt(8)

    p = tf.add_paragraph()
    p.text = "Açıklanabilir Yapay Zekâ (XAI)"
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = TEXT_PRIMARY
    p.space_after = Pt(8)

    p = tf.add_paragraph()
    p.text = "Yapay zekâ kararlarının nasıl anlaşılır hale getirildiği ve geliştirdiğim Üniversite Tercih Asistanı projesi üzerindeki gerçek uygulaması."
    p.font.size = Pt(14)
    p.font.color.rgb = TEXT_SECONDARY

    write_card_content(
        s1, Inches(1.2), Inches(3.55), Inches(5.25), Inches(1.65),
        "1. BÖLÜM", "Açıklanabilir Yapay Zekâ",
        ["Temel kavramlar, neden ihtiyaç duyulduğu, çalışma mantığı ve başlıca yöntemler."],
        bg=BG_CANVAS,
    )
    write_card_content(
        s1, Inches(6.85), Inches(3.55), Inches(5.25), Inches(1.65),
        "2. BÖLÜM", "Geliştirdiğim Proje",
        ["YKS üniversite tercih ve sıralama tahmin sisteminde XAI'ın gerçek dünya uygulaması."],
        bg=BG_HIGHLIGHT,
    )
    add_note_box(
        s1,
        "Merhaba, bugün sizlere Açıklanabilir Yapay Zekâ konusunu ve geliştirdiğim üniversite tercih sistemini anlatacağım. "
        "İlk bölümde yapay zekânın kararlarını neden ve nasıl açıkladığını günlük hayattan basit örneklerle inceleyeceğiz. "
        "İkinci bölümde ise bu yaklaşımı 13.581 lisans programını kapsayan kendi projemde nasıl uyguladığımı göstereceğim."
    )

    # SLAYT 2: XAI NEDİR?
    s2 = prs.slides.add_slide(blank)
    set_bg(s2)
    add_header(s2, "1. Bölüm • Temel Kavram", "Açıklanabilir Yapay Zekâ Nedir?",
               "Yapay zekânın yalnızca sonuç üretmesini değil, o sonuca nasıl ulaştığını da göstermesidir.")
    write_card_content(
        s2, Inches(0.8), Inches(1.8), Inches(5.65), Inches(3.8),
        "SORUN", "Kara Kutu (Black Box) Problemi",
        [
            "Klasik yapay zekâ modelleri veriyi alır ve karmaşık hesaplamalar yaparak bir tahmin üretir; ancak içeride ne olduğunu göstermez.",
            "Basit Örnek: Bir kredi sistemi sadece 'Başvurunuz reddedildi' der, ama sebebini söylemez."
        ]
    )
    write_card_content(
        s2, Inches(6.85), Inches(1.8), Inches(5.68), Inches(3.8),
        "ÇÖZÜM", "Açıklanabilir Yapay Zekâ (XAI)",
        [
            "Modelin verdiği kararın arkasındaki nedenleri sade, şeffaf ve insanların anlayabileceği biçimde ortaya koyar.",
            "XAI ile Örnek: 'Düzenli gelir düşük ve mevcut borç oranı yüksek olduğu için başvurunuz reddedildi.'"
        ],
        bg=BG_HIGHLIGHT,
    )
    add_note_box(
        s2,
        "Geleneksel yapay zekâ sistemleri çoğu zaman içi görünmeyen bir kara kutu gibi çalışır; bir sonuç verir ama o sonuca nasıl ulaştığını söylemez. "
        "Açıklanabilir Yapay Zekâ ise modelin verdiği kararın nedenlerini insanların anlayabileceği şekilde ortaya koyar. "
        "Örneğin bir banka sadece başvurunuz reddedildi demek yerine, bunun gelir veya borç durumundan kaynaklandığını açıkladığında karar anlaşılır hale gelir."
    )

    # SLAYT 3: NEDEN İHTİYAÇ DUYULUR?
    s3 = prs.slides.add_slide(blank)
    set_bg(s3)
    add_header(s3, "1. Bölüm • Gereksinim", "Neden İhtiyaç Duyulur?",
               "Doğru tahmin kadar, o tahminin güvenilir ve denetlenebilir olması da önemlidir.")
    reasons = [
        ("01", "Güven", ["İnsanlar nedenini anladıkları bir öneriye daha kolay güvenir ve sistemi rahatça kullanır."]),
        ("02", "Hata Kontrolü", ["Model bazen doğru cevabı yanlış sebeple bulabilir. Açıklamalar bu hataları erken gösterir."]),
        ("03", "Kritik Kararlar", ["Sağlık, finans ve üniversite seçimi gibi hayati konularda gerekçesiz tahmine güvenilemez."]),
        ("04", "Yasal Haklar", ["Veri koruma yasaları, kişilerin otomatik sistem kararları için açıklama isteme hakkını korur."]),
    ]
    for i, (num, title, lines) in enumerate(reasons):
        write_card_content(s3, Inches(0.8 + i * 2.98), Inches(1.8), Inches(2.78), Inches(2.85), num, title, lines)
    write_card_content(
        s3, Inches(0.8), Inches(4.85), Inches(11.733), Inches(0.8),
        None, "Günlük Hayattan Örnek: Bir doktor 'risk var' uyarısını gördüğünde, hangi tahlil değerlerinin bu uyarıyı tetiklediğini bilmek ister.",
        [], bg=BG_HIGHLIGHT
    )
    add_note_box(
        s3,
        "Bir yapay zekâ insan hayatını etkileyen eğitim, sağlık veya finans gibi alanlarda kullanılıyorsa tek başına tahmin yapmak yeterli değildir. "
        "Kullanıcılar ve uzmanlar, sistemin doğru nedenlerle mi yoksa tesadüfi bir hatayla mı karar verdiğini görmek ister. "
        "Kararın dayanağı bilindiğinde sisteme duyulan güven artar ve olası hatalar erken fark edilir."
    )

    # SLAYT 4: NASIL ÇALIŞIR?
    s4 = prs.slides.add_slide(blank)
    set_bg(s4)
    add_header(s4, "1. Bölüm • Çalışma Mantığı", "Açıklanabilir Yapay Zekâ Nasıl Çalışır?",
               "Tahmin üretildikten sonra, her bilginin sonuca katkısı ölçülerek kullanıcıya sunulur.")
    steps4 = [
        ("1. ADIM", "Girdi Verileri", ["Karar için gerekli bilgiler modele verilir."], BG_CARD),
        ("2. ADIM", "Tahmin Modeli", ["Geçmiş verilerden öğrendiği desenle tahmin hesaplar."], BG_CARD),
        ("3. ADIM", "Açıklayıcı Katman", ["Her bilginin sonucu ne kadar etkilediğini ölçer."], BG_HIGHLIGHT),
        ("4. ADIM", "Sonuç ve Gerekçe", ["Tahmin ile birlikte sade nedenler gösterilir."], BG_HIGHLIGHT),
    ]
    for i, (tag, title, lines, bg) in enumerate(steps4):
        write_card_content(s4, Inches(0.8 + i * 2.98), Inches(1.8), Inches(2.78), Inches(1.85), tag, title, lines, bg=bg)
    write_card_content(
        s4, Inches(0.8), Inches(3.85), Inches(11.733), Inches(1.8),
        "BASİT ÖRNEK", "Ev Fiyatı Tahmini Nasıl Açıklanır?",
        [
            "• Genişlik (120 m²): +1.200.000 TL   |   • Merkezi Konum: +650.000 TL   |   • Bina Yaşı (25 yıl): -300.000 TL",
            "Kullanıcı yalnızca toplam fiyatı değil, her özelliğin fiyata olan etkisini net bir şekilde görür."
        ]
    )
    add_note_box(
        s4,
        "Açıklanabilir yapay zekâda veriler önce tahmin modeline girer ve bir sonuç üretilir. "
        "Ardından açıklayıcı analiz devreye girerek hangi bilginin sonucu ne yönde ve ne kadar etkilediğini ölçer. "
        "Örneğin bir evin fiyatını tahmin ederken sistem sadece toplam fiyatı değil, metrekarenin, konumun ve bina yaşının fiyata katkısını da açıkça gösterir."
    )

    # SLAYT 5: GELENEKSEL VS XAI
    s5 = prs.slides.add_slide(blank)
    set_bg(s5)
    add_header(s5, "1. Bölüm • Karşılaştırma", "Geleneksel Yapay Zekâ ile Farkları",
               "Aynı veriyi kullansalar da kullanıcıya sundukları şeffaflık tamamen farklıdır.")
    tbl = s5.shapes.add_table(6, 3, Inches(0.8), Inches(1.85), Inches(11.733), Inches(3.65)).table
    tbl.columns[0].width = Inches(2.6)
    tbl.columns[1].width = Inches(4.5)
    tbl.columns[2].width = Inches(4.633)
    rows = [
        ("Özellik", "Geleneksel Yapay Zekâ", "Açıklanabilir Yapay Zekâ (XAI)"),
        ("Temel Çıktı", "Yalnızca tek bir sayı veya karar verir.", "Tahmin ile birlikte kararın nedenlerini de verir."),
        ("Cevapladığı Soru", "Sonuç nedir?", "Sonuç nedir ve neden böyle çıktı?"),
        ("Şeffaflık", "İçi kapalı bir kutudur, süreç görülmez.", "Hangi faktörün ne kadar etkili olduğu görülür."),
        ("Hata Tespiti", "Yanlış bir durum yaşanana kadar fark edilmez.", "Mantıksız bir etki hemen denetlenip düzeltilebilir."),
        ("Kullanıcı Deneyimi", "Sonucu sorgulamadan kabul etmek gerekir.", "Kullanıcı kararı anlar ve bilinçli seçim yapar."),
    ]
    for r_i, row in enumerate(rows):
        for c_i, val in enumerate(row):
            cell = tbl.cell(r_i, c_i)
            cell.text = val
            cell.fill.solid()
            if r_i == 0:
                cell.fill.fore_color.rgb = BG_SUBTLE
            elif c_i == 2:
                cell.fill.fore_color.rgb = BG_HIGHLIGHT
            else:
                cell.fill.fore_color.rgb = BG_CARD
            p = cell.text_frame.paragraphs[0]
            p.font.name = "Calibri"
            p.font.size = Pt(11 if r_i > 0 else 11.5)
            p.font.bold = (r_i == 0 or c_i == 0 or c_i == 2)
            p.font.color.rgb = TEXT_PRIMARY if (r_i == 0 or c_i != 1) else TEXT_SECONDARY
    add_note_box(
        s5,
        "İki yaklaşım arasındaki temel fark şeffaflıktır. Geleneksel yapay zekâ yalnızca sonuç nedir sorusuna yanıt verirken, "
        "açıklanabilir yapay zekâ sonucun neden böyle çıktığını da gösterir. Bu sayede kullanıcı öneriyi sorgulamadan kabul etmek yerine "
        "mantığını görerek daha bilinçli bir karar verebilir."
    )

    # SLAYT 6: XAI YÖNTEMLERİ
    s6 = prs.slides.add_slide(blank)
    set_bg(s6)
    add_header(s6, "1. Bölüm • Yöntemler", "Açıklanabilir Yapay Zekâ Yöntemleri",
               "Farklı sorulara yanıt veren üç temel açıklama yaklaşımı vardır.")
    methods = [
        ("1. YÖNTEM", "Özellik Önemi (Feature Importance)", [
            "Modelin genel olarak en çok hangi bilgilere baktığını gösterir.",
            "Örnek: Ev fiyatlarında en belirleyici unsur %65 ile konum, %25 ile büyüklüktür."
        ], BG_CARD),
        ("2. YÖNTEM", "Yerel Katkı Analizi (SHAP / LIME)", [
            "Tek bir örnek için her özelliğin sonuca artı veya eksi etkisini hesaplar.",
            "Örnek: Bu bölümün sırası, kontenjan sabit kaldığı için 1.800 sıra öne çekildi."
        ], BG_HIGHLIGHT),
        ("3. YÖNTEM", "Karşı-Olgusal (Ne Olur?) Analizi", [
            "Bir girdi değiştiğinde sonucun nasıl değişeceğini test eder.",
            "Örnek: Kontenjan 10 kişi artsaydı beklenen sıralama 4.000 sıra gerilerdi."
        ], BG_CARD),
    ]
    for i, (tag, title, lines, bg) in enumerate(methods):
        write_card_content(s6, Inches(0.8 + i * 3.98), Inches(1.8), Inches(3.77), Inches(3.8), tag, title, lines, bg=bg)
    add_note_box(
        s6,
        "Açıklama yöntemleri, sormak istediğimiz soruya göre değişir. Özellik önemi modelin genel olarak en çok hangi bilgilere güvendiğini gösterirken, "
        "SHAP ve LIME tek bir tahminin arkasındaki etkileri hesaplar. Karşı-olgusal analiz ise bir şart değişseydi sonucun nasıl değişeceğini göstererek kullanıcıya yol gösterir."
    )

    # SLAYT 7: AVANTAJLAR VE KULLANIM ALANLARI
    s7 = prs.slides.add_slide(blank)
    set_bg(s7)
    add_header(s7, "1. Bölüm • Etki ve Alanlar", "Avantajları ve Kullanım Alanları",
               "Açıklanabilirlik, yapay zekâyı gerçek hayatta güvenle kullanılabilir hale getirir.")
    write_card_content(
        s7, Inches(0.8), Inches(1.8), Inches(5.65), Inches(3.8),
        "FAYDALAR", "Temel Avantajlar",
        [
            "• Yüksek Güven: Kullanıcı kararın nedenini görerek sisteme güvenir.",
            "• Kolay Hata Ayıklama: Modelin yanlış veriye odaklandığı hızla anlaşılır.",
            "• Adil Kararlar: Önyargılı veya tutarsız sonuçlar engellenebilir.",
            "• Eyleme Dönük Bilgi: Sonucu iyileştirmek için ne yapılacağı görülür."
        ]
    )
    write_card_content(
        s7, Inches(6.85), Inches(1.8), Inches(5.68), Inches(3.8),
        "ALANLAR", "Başlıca Kullanım Alanları",
        [
            "• Sağlık: Hastalık risk tahminlerinde doktorlara bulgu gerekçesi sunma.",
            "• Finans: Kredi ve risk değerlendirmelerinde şeffaf onay süreçleri.",
            "• Hukuk ve Sigorta: Kararların gerekçeli ve denetlenebilir olması.",
            "• Eğitim ve Rehberlik: Öğrencilere üniversite tercihlerinde yol gösterme."
        ],
        bg=BG_HIGHLIGHT,
    )
    add_note_box(
        s7,
        "Açıklanabilir yapay zekâ hataları azaltır, kararlara olan güveni artırır ve sistemlerin denetlenmesini kolaylaştırır. "
        "Bu nedenle doktorların teşhis destek sistemlerinde, bankaların kredi değerlendirmelerinde ve eğitim rehberliğinde yaygın olarak kullanılır. "
        "Şimdi bu yaklaşımı kendi geliştirdiğim üniversite tercih projesi üzerinde gerçek bir uygulama olarak inceleyelim."
    )

    # SLAYT 8: PROJENİN AMACI
    s8 = prs.slides.add_slide(blank)
    set_bg(s8)
    add_header(s8, "2. Bölüm • Uygulama Örneği", "Geliştirdiğim Proje: YKS Tercih Asistanı",
               "Üniversite adayları için şeffaf sıralama tahmini ve akıllı tercih rehberliği platformu.")
    write_card_content(
        s8, Inches(0.8), Inches(1.8), Inches(5.65), Inches(3.8),
        "ÇÖZÜLEN PROBLEM", "Tercih Dönemindeki Belirsizlik",
        [
            "• Çok Fazla Seçenek: Türkiye genelinde 13.581 lisans programı bulunuyor.",
            "• Değişken Koşullar: Kontenjan artışları ve bölüm popülerliği sıralamaları her yıl değiştiriyor.",
            "• Eksik Rehberlik: Yalnızca geçen yılın taban sırasına bakmak hatalı tercihlere yol açabiliyor."
        ]
    )
    write_card_content(
        s8, Inches(6.85), Inches(1.8), Inches(5.68), Inches(3.8),
        "PROJENİN AMACI", "Güvenli ve Açıklamalı Öneri",
        [
            "• Yeni Dönem Tahmini: 2026 yılı beklenen taban sıralamasını öngörmek.",
            "• Güvenli Aralık: Tek sayı yerine %80 güvenli tercih koridoru sunmak.",
            "• Şeffaf Açıklama: Her tahminin ve önerinin nedenini sade bir dille göstermek."
        ],
        bg=BG_HIGHLIGHT,
    )
    add_note_box(
        s8,
        "Geliştirdiğim proje, üniversite adaylarının tercih yaparken karşılaştığı belirsizliği azaltmayı amaçlayan akıllı bir rehberlik sistemidir. "
        "Türkiye'de on binlerce program arasından yalnızca geçen yılın sırasına bakmak, kontenjan ve talep değişimleri nedeniyle hatalı tercihlere yol açabilmektedir. "
        "Sistemim hem yeni dönem sıralamasını tahmin eder hem de her önerinin arkasındaki nedenleri öğrenciye açıkça sunar."
    )

    # SLAYT 9: VERİ SETİ VE TEKNOLOJİLER
    s9 = prs.slides.add_slide(blank)
    set_bg(s9)
    add_header(s9, "2. Bölüm • Altyapı", "Kullanılan Veri Seti ve Teknolojiler",
               "Sistemin veri kaynağı ve geliştirilmesinde kullanılan gerçek yazılım araçları.")
    stats = [
        ("13.581 Program", "2023–2025 ÖSYM/YÖK Atlas verileri (34.197 kayıt)"),
        ("11.863 Katalog", "Üniversite, puan türü ve kontenjan detayları"),
        ("81 İl + KKTC", "Şehir bazlı üniversite ve yaşam maliyeti analizi"),
    ]
    for i, (val, lbl) in enumerate(stats):
        write_card_content(s9, Inches(0.8 + i * 3.98), Inches(1.78), Inches(3.77), Inches(1.12), None, val, [lbl], bg=BG_HIGHLIGHT)

    write_card_content(
        s9, Inches(0.8), Inches(3.1), Inches(5.65), Inches(2.55),
        "YAPAY ZEKÂ VE VERİ", "Modelleme ve Açıklanabilirlik",
        [
            "• LightGBM: Taban sıralaması ve güvenli aralık tahmin modelleri.",
            "• SHAP (TreeSHAP): Tahmin gerekçelerini ve özellik etkilerini hesaplama.",
            "• Pandas, NumPy, Scikit-learn, Joblib: Veri işleme ve model doğrulama.",
            "• OpenAI API (gpt-4o-mini): Veriye dayalı doğal dil rehberlik sohbeti."
        ]
    )
    write_card_content(
        s9, Inches(6.85), Inches(3.1), Inches(5.68), Inches(2.55),
        "UYGULAMA MİMARİSİ", "Arka Uç ve Kullanıcı Arayüzü",
        [
            "• FastAPI ve Uvicorn (Python): Tahmin, öneri, harita ve sohbet API servisleri.",
            "• React ve TypeScript: Hızlı ve etkileşimli tek sayfa web arayüzü.",
            "• Vite ve Tailwind CSS: Açık/Koyu tema destekli sade kullanıcı tasarımı."
        ]
    )
    add_note_box(
        s9,
        "Projede 2023 ile 2025 yılları arasındaki resmi ÖSYM ve YÖK Atlas verilerinden oluşan 13.581 programlık bir veri seti kullandım. "
        "Tahmin modellerini Python ve LightGBM ile geliştirip, kararların nedenlerini TreeSHAP ve OpenAI dil modeli desteğiyle açıkladım. "
        "Kullanıcı arayüzünü ise öğrencilerin rahatça gezinebileceği React ve FastAPI tabanlı bir web uygulaması olarak tasarladım."
    )

    # SLAYT 10: ALGORİTMALARIN ÇALIŞMA MANTIĞI
    s10 = prs.slides.add_slide(blank)
    set_bg(s10)
    add_header(s10, "2. Bölüm • Algoritmalar", "Algoritmalar ve Çalışma Mantığı",
               "Modeller geçmiş verilerden örüntü öğrenir, açıklayıcı katman ise her faktörün payını ayırır.")
    write_card_content(
        s10, Inches(0.8), Inches(1.8), Inches(3.77), Inches(3.8),
        "TAHMİN", "LightGBM Regresyonu",
        [
            "Yüzlerce küçük karar ağacı sırayla eğitilir; her yeni ağaç bir öncekinin hatasını düzeltir.",
            "• SAY, EA, SÖZ, DİL için 4 ayrı model eğitilmiştir.",
            "• Quantile Regresyon (%10 ve %90) ile %80 güvenli tercih koridoru üretilir."
        ]
    )
    write_card_content(
        s10, Inches(4.78), Inches(1.8), Inches(3.77), Inches(3.8),
        "GİRDİLER", "Kullanılan 4 Temel Özellik",
        [
            "• Son Taban Sırası: Önceki yılın kapanış sırası.",
            "• Kontenjan Sayısı: Bölümün öğrenci kapasitesi.",
            "• Kontenjan Değişimi: Kapasite artış/azalış oranı (%).",
            "• Sıralama İvmesi: Son yıllardaki talep yükselme veya gevşeme eğilimi."
        ]
    )
    write_card_content(
        s10, Inches(8.76), Inches(1.8), Inches(3.77), Inches(3.8),
        "AÇIKLAMA", "TreeSHAP ve Simülatör",
        [
            "TreeSHAP, puan türünün ortalama sırasından başlayarak bu 4 özelliğin kaç sıra eklediğini veya düşürdüğünü hesaplar.",
            "Ne Olur? Simülatörü ise kontenjan değiştirildiğinde yeni sonucu anlık yeniden hesaplar."
        ],
        bg=BG_HIGHLIGHT,
    )
    add_note_box(
        s10,
        "Tahmin için tablo verilerinde çok hızlı ve başarılı çalışan LightGBM karar ağaçlarını kullandım ve her puan türü için ayrı bir model eğittim. "
        "Sistem yalnızca tek bir tahmin vermek yerine, Quantile Regresyon sayesinde öğrenciye güvenli bir alt ve üst sınır aralığı da sunar. "
        "Ardından TreeSHAP yöntemi, geçmiş sıra, kontenjan ve talep ivmesinin bu tahmine kaç sıra etki ettiğini tek tek hesaplar. "
        "Böylece hem neden bu sıranın beklendiği görülür hem de kontenjan değişirse ne olacağı anında test edilebilir."
    )

    # SLAYT 11: SİSTEMİN ÇALIŞMA AŞAMALARI
    s11 = prs.slides.add_slide(blank)
    set_bg(s11)
    add_header(s11, "2. Bölüm • Sistem Akışı", "Sistemin Çalışma Aşamaları",
               "Öğrencinin bilgi girmesinden anlaşılır rehberlik sonucuna kadar 4 aşamalı süreç.")
    flow11 = [
        ("1. AŞAMA", "Öğrenci Girdisi", ["Puan türü, sıralama ve şehir/bölüm tercihleri alınır."], BG_CARD),
        ("2. AŞAMA", "Filtreleme ve Tahmin", ["LightGBM 2026 sırası ve güvenli aralığı hesaplar."], BG_CARD),
        ("3. AŞAMA", "Nedenlerin Çıkarılması", ["TreeSHAP her faktörün etki payını belirler."], BG_HIGHLIGHT),
        ("4. AŞAMA", "Anlaşılır Sunum", ["Karar kartları, grafik ve sohbet ile sunulur."], BG_HIGHLIGHT),
    ]
    for i, (tag, title, lines, bg) in enumerate(flow11):
        write_card_content(s11, Inches(0.8 + i * 2.98), Inches(1.8), Inches(2.78), Inches(1.95), tag, title, lines, bg=bg)

    mods = [
        ("Tercih Danışmanı", ["Programları 'Daha Rekabetçi', 'Sıralamana Yakın' ve 'Daha Ulaşılabilir' olarak dengeli sıralar."]),
        ("Ölü Tercih Kontrolü", ["24'lü tercih listesinde sıralama hatalarını tespit eder ve otomatik düzenleme önerir."]),
        ("Sohbet Danışmanı", ["Model tahminlerini ve SHAP gerekçelerini bağlam olarak alıp öğrenciyle doğal Türkçe konuşur."]),
    ]
    for i, (title, lines) in enumerate(mods):
        write_card_content(s11, Inches(0.8 + i * 3.98), Inches(3.95), Inches(3.77), Inches(1.7), None, title, lines)

    add_note_box(
        s11,
        "Öğrenci sıralamasını ve kriterlerini girdiğinde sistem önce 13.581 program arasından uygun bölümleri filtreleyip puanlar. "
        "Ardından LightGBM modeli gelecek dönem sırasını ve güvenli aralığı hesaplar, TreeSHAP ise tahmini oluşturan faktörleri ayırır. "
        "Son aşamada bu veriler sade karar kartlarına, ölü tercih denetimine ve sohbet danışmanına aktarılarak öğrencinin kolayca anlayacağı şekilde sunulur."
    )

    # SLAYT 12: GERÇEK SONUÇ ÖRNEĞİ VE KAPANIŞ
    s12 = prs.slides.add_slide(blank)
    set_bg(s12)
    add_header(s12, "2. Bölüm • Gerçek Sonuç ve Değerlendirme", "Gerçek Uygulama Sonucu ve Performans",
               "Sistemin gerçek bir lisans programı üzerindeki TreeSHAP çıktısı ve 2025 doğrulama sonuçları.")
    write_card_content(
        s12, Inches(0.8), Inches(1.8), Inches(5.65), Inches(3.8),
        "GERÇEK ÖRNEK • KOD: 106510014", "Abdullah Gül Üni. — Mimarlık (İngilizce)",
        [
            "2025 Taban: 156.190  |  Kontenjan: 50 kişi  |  İvme: 0.88x",
            "• Başlangıç Ortalaması (SAY): 263.783",
            "• Geçmiş Taban Sırası Etkisi: -99.870 (Öne çeken ana güç)",
            "• Kontenjan Değişimi (%0) ve Hacim: -1.630",
            "▶ 2026 Beklenen Sıralama: 162.283 (Güvenli Aralık: 146.484 – 212.102)"
        ],
        bg=BG_HIGHLIGHT,
    )
    write_card_content(
        s12, Inches(6.85), Inches(1.8), Inches(5.68), Inches(3.8),
        "2025 KÖR TEST SONUÇLARI (7.811 PROGRAM)", "Tahmin Doğruluğu Karşılaştırması",
        [
            "• Genel Ortalama Hata (MAE): Basit yöntemde 94.942 iken, modelimizde 80.361 (%15,4 daha düşük hata).",
            "• Eşit Ağırlık (2.726 prog.): 158.817 → 125.072 (%21,2 iyileşme).",
            "• Sözel (1.391 prog.): 79.005 → 61.767 (%21,8 iyileşme).",
            "• Yabancı Dil (489 prog.): 10.621 → 9.241 (%13,0 iyileşme)."
        ]
    )
    add_note_box(
        s12,
        "Ekranda sistemimin Abdullah Gül Üniversitesi Mimarlık bölümü için ürettiği gerçek sonucu ve açıklamasını görüyorsunuz. "
        "Model 2026 yılı için 162.283 sıralamasını öngörmüş ve bu sonucun temel nedeninin geçen yılki 156.190 taban gücü olduğunu TreeSHAP ile göstermiştir. "
        "Ayrıca 7.811 program üzerindeki gerçek testlerde sistemimiz, sadece geçen yılı temel alan yönteme kıyasla hatayı yüzde 15,4 azaltmıştır; dinlediğiniz için teşekkür ederim."
    )

    out_path = os.path.join("presentation", "Aciklanabilir_Yapay_Zeka_XAI_Sunumu.pptx")
    try:
        prs.save(out_path)
        print(f"PowerPoint sunumu başarıyla oluşturuldu: {out_path} ({len(prs.slides)} Slayt)")
    except PermissionError:
        alt_path = os.path.join("presentation", "Aciklanabilir_Yapay_Zeka_XAI_Sunumu_Guncel.pptx")
        prs.save(alt_path)
        print(f"Orijinal dosya açık olduğu için sunum şuraya kaydedildi: {alt_path} ({len(prs.slides)} Slayt)")


if __name__ == "__main__":
    build_presentation()
