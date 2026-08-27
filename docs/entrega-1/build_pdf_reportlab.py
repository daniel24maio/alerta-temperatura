import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Preformatted, PageBreak, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Cabeçalho (Páginas > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "Arquitetura de IoT - Entrega 1: Planejamento e Arquitetura do Projeto")
            self.drawRightString(558, 750, f"Página {self._pageNumber} de {page_count}")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)

        # Rodapé
        self.setFont("Helvetica-Oblique", 8)
        self.setFillColor(colors.HexColor("#94a3b8"))
        self.drawString(54, 30, "Sistema de Alerta de Temperatura e Saúde Ambiental IoT")
        self.drawRightString(558, 30, "IFMG - Arquitetura de IoT")
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(54, 42, 558, 42)
        self.restoreState()

def build_pdf(md_file, pdf_file):
    with open(md_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    doc = SimpleDocTemplate(
        pdf_file,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'Heading1Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.HexColor("#0284c7"),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Heading3Custom',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#334155"),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=body_style,
        leftIndent=15,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        fontName='Courier',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#f8fafc"),
        backColor=colors.HexColor("#0f172a"),
        borderPadding=6,
        spaceBefore=6,
        spaceAfter=8
    )

    story = []
    in_code = False
    code_lines = []

    for line in lines:
        raw = line.rstrip()

        if '<div style="page-break-after: always;"></div>' in raw:
            story.append(PageBreak())
            continue

        if raw.startswith('```'):
            if in_code:
                in_code = False
                code_text = "\n".join(code_lines)
                story.append(Preformatted(code_text, code_style))
                story.append(Spacer(1, 4))
                code_lines = []
            else:
                in_code = True
                code_lines = []
            continue

        if in_code:
            code_lines.append(raw)
            continue

        if not raw.strip():
            continue

        # Formatação Básica de Inline Markdown
        formatted = raw
        formatted = formatted.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        # Re-allow basic html tags for reportlab
        formatted = formatted.replace('&lt;b&gt;', '<b>').replace('&lt;/b&gt;', '</b>')
        
        # Converte Markdown **bold** em <b>bold</b>
        import re
        formatted = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', formatted)
        formatted = re.sub(r'`(.*?)`', r'<font face="Courier">\1</font>', formatted)

        if raw.startswith('# '):
            story.append(Paragraph(formatted[2:], title_style))
            story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=10))
        elif raw.startswith('## '):
            story.append(Paragraph(formatted[3:], h1_style))
        elif raw.startswith('### '):
            story.append(Paragraph(formatted[4:], h2_style))
        elif raw.startswith('#### '):
            story.append(Paragraph(formatted[5:], h3_style))
        elif raw.startswith('---'):
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceBefore=6, spaceAfter=6))
        elif raw.startswith('- ') or raw.startswith('* '):
            story.append(Paragraph(f"• {formatted[2:]}", bullet_style))
        else:
            story.append(Paragraph(formatted, body_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF gerado com sucesso pelo ReportLab: {pdf_file}")

if __name__ == '__main__':
    md = "/Users/daniel/ifmg/io-sensor/alerta-temperatura/docs/entrega-1/Entrega_1_Planejamento_e_Arquitetura_IoT.md"
    pdf = "/Users/daniel/ifmg/io-sensor/alerta-temperatura/docs/entrega-1/Entrega_1_Planejamento_e_Arquitetura_IoT.pdf"
    build_pdf(md, pdf)
