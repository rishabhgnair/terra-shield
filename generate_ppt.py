import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_sih_presentation():
    prs = Presentation()
    
    # Set slide dimensions to 16:9 widescreen
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    
    # Colors
    DARK_BLUE = RGBColor(15, 42, 74)     # #0F2A4A Primary Header
    EMERALD_GREEN = RGBColor(16, 124, 65) # #107C41 Accent
    BG_LIGHT = RGBColor(246, 247, 242)   # #F6F7F2
    TEXT_DARK = RGBColor(35, 39, 42)     # #23272A
    CARD_BG = RGBColor(255, 255, 255)
    ACCENT_ORANGE = RGBColor(224, 86, 36) # #E05624
    
    blank_slide_layout = prs.slide_layouts[6]
    
    def add_header(slide, title_text, category_text="SMART INDIA HACKATHON 2026"):
        # Top banner background
        shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(1.1))
        shape.fill.solid()
        shape.fill.fore_color.rgb = DARK_BLUE
        shape.line.fill.background()
        
        # Title text
        txBox = slide.shapes.add_textbox(Inches(0.6), Inches(0.15), Inches(9.5), Inches(0.8))
        tf = txBox.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title_text
        p.font.size = Pt(26)
        p.font.bold = True
        p.font.color.rgb = RGBColor(255, 255, 255)
        p.font.name = "Arial"
        
        # Subtitle / Hackathon badge
        txBox2 = slide.shapes.add_textbox(Inches(9.5), Inches(0.2), Inches(3.3), Inches(0.7))
        tf2 = txBox2.text_frame
        p2 = tf2.paragraphs[0]
        p2.text = category_text
        p2.alignment = PP_ALIGN.RIGHT
        p2.font.size = Pt(14)
        p2.font.bold = True
        p2.font.color.rgb = RGBColor(255, 215, 0)
        p2.font.name = "Arial"
        
        # Team Badge Circle (Top Left / Right indicator)
        badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(10.5), Inches(0.65), Inches(2.2), Inches(0.35))
        badge.fill.solid()
        badge.fill.fore_color.rgb = EMERALD_GREEN
        badge.line.fill.background()
        tf_b = badge.text_frame
        pb = tf_b.paragraphs[0]
        pb.text = "Team: NullVerse"
        pb.alignment = PP_ALIGN.CENTER
        pb.font.size = Pt(12)
        pb.font.bold = True
        pb.font.color.rgb = RGBColor(255, 255, 255)

    def add_bullet_point(tf, header, body):
        p = tf.add_paragraph()
        p.font.size = Pt(16)
        p.space_after = Pt(12)
        
        run_h = p.add_run()
        run_h.text = f"• {header}: "
        run_h.font.bold = True
        run_h.font.color.rgb = DARK_BLUE
        run_h.font.name = "Arial"
        
        run_b = p.add_run()
        run_b.text = body
        run_b.font.bold = False
        run_b.font.color.rgb = TEXT_DARK
        run_b.font.name = "Arial"

    # ==================== SLIDE 1: TITLE PAGE ====================
    slide1 = prs.slides.add_slide(blank_slide_layout)
    
    # Title Slide Header Banner
    shape1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(1.8))
    shape1.fill.solid()
    shape1.fill.fore_color.rgb = DARK_BLUE
    shape1.line.fill.background()
    
    tb1 = slide1.shapes.add_textbox(Inches(0.8), Inches(0.3), Inches(11.7), Inches(1.2))
    tf1 = tb1.text_frame
    p1 = tf1.paragraphs[0]
    p1.text = "SMART INDIA HACKATHON 2026"
    p1.font.size = Pt(32)
    p1.font.bold = True
    p1.font.color.rgb = RGBColor(255, 215, 0)
    
    p1_sub = tf1.add_paragraph()
    p1_sub.text = "IDEA SUBMISSION PRESENTATION"
    p1_sub.font.size = Pt(18)
    p1_sub.font.color.rgb = RGBColor(255, 255, 255)
    
    # Main Title Card
    card1 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(2.2), Inches(11.733), Inches(4.7))
    card1.fill.solid()
    card1.fill.fore_color.rgb = CARD_BG
    card1.line.color.rgb = RGBColor(210, 215, 220)
    
    tf_c1 = card1.text_frame
    tf_c1.word_wrap = True
    
    p_t = tf_c1.paragraphs[0]
    p_t.text = "TERRA SHIELD - AI-Powered Landslide Risk Monitoring & Early Warning System"
    p_t.font.size = Pt(22)
    p_t.font.bold = True
    p_t.font.color.rgb = EMERALD_GREEN
    p_t.space_after = Pt(20)
    
    add_bullet_point(tf_c1, "Problem Statement ID", "SIH26001")
    add_bullet_point(tf_c1, "Problem Statement Title", "AI-Powered Landslide Risk Monitoring & Early Warning System for Mountainous Terrains")
    add_bullet_point(tf_c1, "Theme", "Disaster Management & Environmental Protection")
    add_bullet_point(tf_c1, "PS Category", "Software / Hardware Hybrid Prototype")
    add_bullet_point(tf_c1, "Team Name", "NullVerse")
    add_bullet_point(tf_c1, "Team ID", "SIH2026-NULLVERSE-001")

    # ==================== SLIDE 2: PROPOSED SOLUTION ====================
    slide2 = prs.slides.add_slide(blank_slide_layout)
    add_header(slide2, "PROPOSED SOLUTION: TERRA SHIELD")
    
    # Left Card: Detailed Explanation
    card2_l = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.4), Inches(5.8), Inches(5.5))
    card2_l.fill.solid()
    card2_l.fill.fore_color.rgb = CARD_BG
    card2_l.line.color.rgb = RGBColor(210, 215, 220)
    tf2_l = card2_l.text_frame
    tf2_l.word_wrap = True
    
    p = tf2_l.paragraphs[0]
    p.text = "End-to-End Solution Overview"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = DARK_BLUE
    p.space_after = Pt(14)
    
    add_bullet_point(tf2_l, "Real-Time Telemetry Ingestion", "Ingests live multi-station IoT sensor metrics (Rainfall, Slope Angle, Soil Moisture, Displacement, Temperature).")
    add_bullet_point(tf2_l, "2-Layer Hybrid Risk Engine", "Combines ML Random Forest classification with deterministic Physical Safety Rules override.")
    add_bullet_point(tf2_l, "Geographic GIS Overlay", "OpenStreetMap Leaflet GIS console with station risk markers, hazard radius zones, and search.")
    add_bullet_point(tf2_l, "Zero-Cost Free Infrastructure", "Operates entirely on 100% free open APIs (Leaflet OSM, Open-Meteo weather, Nominatim reverse geocoding).")

    # Right Card: Novelty & Innovation
    card2_r = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.4), Inches(5.9), Inches(5.5))
    card2_r.fill.solid()
    card2_r.fill.fore_color.rgb = CARD_BG
    card2_r.line.color.rgb = RGBColor(210, 215, 220)
    tf2_r = card2_r.text_frame
    tf2_r.word_wrap = True
    
    p = tf2_r.paragraphs[0]
    p.text = "Innovation & Uniqueness"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = EMERALD_GREEN
    p.space_after = Pt(14)
    
    add_bullet_point(tf2_r, "Safety Threshold Escalation", "Physical rules (e.g. heavy rain + active ground movement) strictly escalate ML predictions, eliminating false low-risk output.")
    add_bullet_point(tf2_r, "Live Feature Contribution", "Offers full explainability by breaking down percentage contributions for each environmental factor.")
    add_bullet_point(tf2_r, "Live Weather & Geocoding", "Integrates Open-Meteo atmospheric forecast and Nominatim reverse geocoding for any clicked terrain point.")
    add_bullet_point(tf2_r, "Zero API Key Requirement", "Deploys frictionlessly without requiring paid cloud mapping keys or expensive proprietary subscriptions.")

    # ==================== SLIDE 3: TECHNICAL APPROACH ====================
    slide3 = prs.slides.add_slide(blank_slide_layout)
    add_header(slide3, "TECHNICAL APPROACH & ARCHITECTURE")
    
    # Card 1: Tech Stack
    card3_1 = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.4), Inches(5.8), Inches(5.5))
    card3_1.fill.solid()
    card3_1.fill.fore_color.rgb = CARD_BG
    card3_1.line.color.rgb = RGBColor(210, 215, 220)
    tf3_1 = card3_1.text_frame
    tf3_1.word_wrap = True
    
    p = tf3_1.paragraphs[0]
    p.text = "Technology Stack"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = DARK_BLUE
    p.space_after = Pt(14)
    
    add_bullet_point(tf3_1, "Frontend UI Console", "React 18, Vite 5, Tailwind CSS, Lucide Icons, Recharts Analytics, Leaflet GIS.")
    add_bullet_point(tf3_1, "Backend REST API", "Python 3.14, Flask, Flask-CORS, SQLite Database engine.")
    add_bullet_point(tf3_1, "Machine Learning", "Scikit-Learn Random Forest Classifier, Pandas, NumPy, Joblib model persistence.")
    add_bullet_point(tf3_1, "IoT Telemetry Ingestion", "Python Requests, ESP32 sensor simulator supporting NORMAL, WARNING, CRITICAL, FAULT modes.")

    # Card 2: Implementation Process Flow
    card3_2 = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.4), Inches(5.9), Inches(5.5))
    card3_2.fill.solid()
    card3_2.fill.fore_color.rgb = CARD_BG
    card3_2.line.color.rgb = RGBColor(210, 215, 220)
    tf3_2 = card3_2.text_frame
    tf3_2.word_wrap = True
    
    p = tf3_2.paragraphs[0]
    p.text = "End-to-End Execution Flow"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = EMERALD_GREEN
    p.space_after = Pt(14)
    
    add_bullet_point(tf3_2, "1. Ingestion & Sanitization", "IoT Edge Nodes transmit telemetry to POST /api/sensor-data; values validated against physical physical bounds.")
    add_bullet_point(tf3_2, "2. ML Inference & Rules", "Random Forest computes probability scores; deterministic rules check displacement thresholds.")
    add_bullet_point(tf3_2, "3. Risk Classification", "Outputs unified status (LOW, MODERATE, HIGH, CRITICAL) with safety override alerts.")
    add_bullet_point(tf3_2, "4. Real-Time Visualization", "Pushes alerts to React Dashboard, OpenStreetMap risk zones, and exports CSV logs.")

    # ==================== SLIDE 4: FEASIBILITY AND VIABILITY ====================
    slide4 = prs.slides.add_slide(blank_slide_layout)
    add_header(slide4, "FEASIBILITY AND RISK MITIGATION")
    
    # 3 Column Cards
    col_w = Inches(3.8)
    
    # Col 1: Feasibility Analysis
    card4_1 = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.4), col_w, Inches(5.5))
    card4_1.fill.solid()
    card4_1.fill.fore_color.rgb = CARD_BG
    card4_1.line.color.rgb = RGBColor(210, 215, 220)
    tf4_1 = card4_1.text_frame
    tf4_1.word_wrap = True
    
    p = tf4_1.paragraphs[0]
    p.text = "Feasibility Analysis"
    p.font.size = Pt(17)
    p.font.bold = True
    p.font.color.rgb = DARK_BLUE
    p.space_after = Pt(12)
    
    add_bullet_point(tf4_1, "Low Hardware Cost", "Utilizes off-the-shelf ESP32 microcontrollers and rain/inclinometer sensors (~₹3,500 per station).")
    add_bullet_point(tf4_1, "Zero Software Licensing", "Built entirely on open-source frameworks (React, Flask, Scikit-learn, SQLite).")
    add_bullet_point(tf4_1, "Scalable Architecture", "Supports seamless addition of monitoring nodes across mountain highway corridors.")

    # Col 2: Potential Challenges & Risks
    card4_2 = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.75), Inches(1.4), col_w, Inches(5.5))
    card4_2.fill.solid()
    card4_2.fill.fore_color.rgb = CARD_BG
    card4_2.line.color.rgb = RGBColor(210, 215, 220)
    tf4_2 = card4_2.text_frame
    tf4_2.word_wrap = True
    
    p = tf4_2.paragraphs[0]
    p.text = "Challenges & Risks"
    p.font.size = Pt(17)
    p.font.bold = True
    p.font.color.rgb = ACCENT_ORANGE
    p.space_after = Pt(12)
    
    add_bullet_point(tf4_2, "Network Blackouts", "Remote mountain terrains frequently experience cellular network loss during severe storms.")
    add_bullet_point(tf4_2, "Sensor Noise & Drift", "Vibrations from heavy road vehicles can cause transient displacement spikes.")
    add_bullet_point(tf4_2, "Extreme Power Draw", "Continuous sensor operation risks battery depletion during heavy cloud cover.")

    # Col 3: Mitigation Strategies
    card4_3 = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.9), Inches(1.4), col_w, Inches(5.5))
    card4_3.fill.solid()
    card4_3.fill.fore_color.rgb = CARD_BG
    card4_3.line.color.rgb = RGBColor(210, 215, 220)
    tf4_3 = card4_3.text_frame
    tf4_3.word_wrap = True
    
    p = tf4_3.paragraphs[0]
    p.text = "Mitigation Strategies"
    p.font.size = Pt(17)
    p.font.bold = True
    p.font.color.rgb = EMERALD_GREEN
    p.space_after = Pt(12)
    
    add_bullet_point(tf4_3, "Local Flash Buffering", "Edge nodes store unsent readings locally during outage and auto-sync upon reconnecting.")
    add_bullet_point(tf4_3, "Input Validation Layer", "Backend bounds validation sanitizes noisy data before passing it to the ML predictor.")
    add_bullet_point(tf4_3, "Solar Power + Sleep Mode", "Solar micro-panels with adaptive deep-sleep polling extend battery life to 30+ days.")

    # ==================== SLIDE 5: IMPACT AND BENEFITS ====================
    slide5 = prs.slides.add_slide(blank_slide_layout)
    add_header(slide5, "IMPACT AND SOCIETAL BENEFITS")
    
    # Top Card: Target Audience
    card5_top = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.4), Inches(12.133), Inches(2.3))
    card5_top.fill.solid()
    card5_top.fill.fore_color.rgb = CARD_BG
    card5_top.line.color.rgb = RGBColor(210, 215, 220)
    tf5_t = card5_top.text_frame
    tf5_t.word_wrap = True
    
    p = tf5_t.paragraphs[0]
    p.text = "Target Beneficiaries & User Groups"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = DARK_BLUE
    p.space_after = Pt(8)
    
    add_bullet_point(tf5_t, "Disaster Management Authorities", "NDMA, State Disaster Management Authorities (SDMA), and District Collectors for rapid alert dispatch.")
    add_bullet_point(tf5_t, "Infrastructure & Highways", "Border Roads Organisation (BRO), NHAI, and railway operators for proactive road blockades.")
    add_bullet_point(tf5_t, "Mountain Communities", "Local residents, tourists, and commercial transport drivers in high-risk hill regions.")

    # Bottom Grid: Benefits (Social, Economic, Environmental)
    card5_b = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(3.9), Inches(12.133), Inches(3.0))
    card5_b.fill.solid()
    card5_b.fill.fore_color.rgb = CARD_BG
    card5_b.line.color.rgb = RGBColor(210, 215, 220)
    tf5_b = card5_b.text_frame
    tf5_b.word_wrap = True
    
    p = tf5_b.paragraphs[0]
    p.text = "Multi-Dimensional Impact"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = EMERALD_GREEN
    p.space_after = Pt(8)
    
    add_bullet_point(tf5_b, "Social Impact (Life Safety)", "Provides crucial 30–60 minute early warning lead time, allowing safe evacuation and minimizing casualties.")
    add_bullet_point(tf5_b, "Economic Protection", "Prevents vehicular damage, reduces highway closure durations, and protects hill economy logistics.")
    add_bullet_point(tf5_b, "Environmental Intelligence", "Aggregates long-term slope deformation and precipitation trends for regional disaster planning.")

    # ==================== SLIDE 6: RESEARCH AND REFERENCES ====================
    slide6 = prs.slides.add_slide(blank_slide_layout)
    add_header(slide6, "RESEARCH AND REFERENCES")
    
    card6 = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.4), Inches(12.133), Inches(5.5))
    card6.fill.solid()
    card6.fill.fore_color.rgb = CARD_BG
    card6.line.color.rgb = RGBColor(210, 215, 220)
    tf6 = card6.text_frame
    tf6.word_wrap = True
    
    p = tf6.paragraphs[0]
    p.text = "Research Foundation & Standards"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = DARK_BLUE
    p.space_after = Pt(14)
    
    add_bullet_point(tf6, "Geotechnical Standards", "Geological Survey of India (GSI) Landslide Susceptibility Mapping Guidelines & Rainfall Threshold Models.")
    add_bullet_point(tf6, "Machine Learning Literature", "Scikit-Learn Random Forest Classifier benchmarks for environmental telemetry anomaly detection.")
    add_bullet_point(tf6, "Open Spatial & Weather APIs", "OpenStreetMap Leaflet GIS standards & Open-Meteo WMO weather code classification API.")
    add_bullet_point(tf6, "Disaster Management Frameworks", "National Disaster Management Authority (NDMA) National Landslide Risk Management Strategy (2019).")
    add_bullet_point(tf6, "Source Code Repository", "Complete end-to-end working prototype source code: Terra Shield SIH Hackathon Repository.")

    # Save presentation
    output_path = "SIH26001_NullVerse_Presentation.pptx"
    prs.save(output_path)
    print(f"Successfully generated SIH PPT presentation: {output_path}")

if __name__ == "__main__":
    create_sih_presentation()
