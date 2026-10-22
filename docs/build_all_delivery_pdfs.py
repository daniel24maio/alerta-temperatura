import os
import re
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Preformatted, PageBreak, HRFlowable, Image as RLImage
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, delivery_title="Relatório Técnico", **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []
        self.delivery_title = delivery_title

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#475569"))

        # Cabeçalho (Páginas > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, f"IFMG Ouro Branco | IoT III — {self.delivery_title}")
            self.drawRightString(558, 750, f"Página {self._pageNumber} de {page_count}")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.6)
            self.line(54, 742, 558, 742)

        # Rodapé em todas as páginas
        self.setFont("Helvetica-Oblique", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(54, 30, "Sistema de Alerta de Temperatura e Saúde Ambiental IoT — Aluno: Daniel")
        self.drawRightString(558, 30, "Prof. Charles Tim Batista Garrocho")
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.6)
        self.line(54, 42, 558, 42)
        self.restoreState()


def make_canvas_class(delivery_title):
    class CustomDeliveryCanvas(NumberedCanvas):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, delivery_title=delivery_title, **kwargs)
    return CustomDeliveryCanvas


def parse_inline_markdown(text):
    text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    # Converte negrito, itálico e código inline com alto destaque
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)
    text = re.sub(r'`(.*?)`', r'<b><font face="Courier" color="#0369a1">\1</font></b>', text)
    text = text.replace('[x]', '☑').replace('[ ]', '☐')
    return text


def smart_wrap_line(line, max_len=72):
    """Quebra linhas longas de código preservando indentação para evitar truncamento no PDF."""
    if len(line) <= max_len:
        return [line]

    indent = len(line) - len(line.lstrip())
    indent_str = ' ' * indent
    # Tenta quebrar em espaços ou vírgulas
    words = re.split(r'(\s+)', line)
    wrapped = []
    current = ''

    for w in words:
        if len(current) + len(w) <= max_len:
            current += w
        else:
            if current.strip():
                wrapped.append(current)
            current = indent_str + '    ' + w.lstrip()

    if current.strip():
        wrapped.append(current)

    return wrapped if wrapped else [line]


def get_language_label(lang_hint):
    hint = (lang_hint or '').lower().strip()
    if 'cpp' in hint or 'arduino' in hint or 'c++' in hint:
        return "C++ / Firmware ESP32"
    if 'ts' in hint or 'typescript' in hint or 'javascript' in hint or 'js' in hint:
        return "TypeScript / Gateway Node.js"
    if 'json' in hint:
        return "JSON / Payload de Telemetria e Comandos"
    if 'bash' in hint or 'sh' in hint or 'shell' in hint:
        return "Terminal / Comandos de Execução"
    if 'text' in hint or 'log' in hint:
        return "Log de Execução / Diagnóstico"
    return "Trecho de Código / Configuração"


def build_delivery_pdf(md_file_path, output_pdf_path, delivery_header_title):
    print(f"-> Processando: {os.path.basename(md_file_path)}...")
    with open(md_file_path, 'r', encoding='utf-8') as f:
        lines = [l.rstrip() for l in f.readlines()]

    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=17,
        leading=21,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=10
    )

    h1_style = ParagraphStyle(
        'Heading1Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=12.5,
        leading=15.5,
        textColor=colors.HexColor("#0284c7"),
        spaceBefore=12,
        spaceAfter=5,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13.5,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=9,
        spaceAfter=4,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Heading3Custom',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12,
        textColor=colors.HexColor("#334155"),
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=body_style,
        leftIndent=14,
        spaceAfter=3
    )

    # Estilo de Código com Alta Legibilidade (8.5 pt, espaçamento generoso, fundo suave e borda limpa)
    code_text_style = ParagraphStyle(
        'CodeTextStyle',
        fontName='Courier',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#0f172a"),
        backColor=colors.HexColor("#f8fafc"),
        borderColor=colors.HexColor("#cbd5e1"),
        borderWidth=0.8,
        borderPadding=7,
        spaceBefore=2,
        spaceAfter=6,
    )

    code_header_style = ParagraphStyle(
        'CodeHeaderStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#0284c7"),
        spaceBefore=6,
        spaceAfter=2,
        keepWithNext=True
    )

    table_header_style = ParagraphStyle(
        'THStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white,
        alignment=0
    )

    table_cell_style = ParagraphStyle(
        'TDStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#1e293b"),
        alignment=0
    )

    story = []
    i = 0
    total_lines = len(lines)

    while i < total_lines:
        line = lines[i]

        if '<div style="page-break-after: always;"></div>' in line:
            story.append(PageBreak())
            i += 1
            continue

        # Bloco de Código (```lang ... ```)
        if line.startswith('```'):
            lang_hint = line[3:].strip()
            code_lines = []
            i += 1
            while i < total_lines and not lines[i].startswith('```'):
                raw_code_line = lines[i]
                wrapped_sublines = smart_wrap_line(raw_code_line, max_len=72)
                code_lines.extend(wrapped_sublines)
                i += 1
            i += 1  # pula linha ```

            code_text = "\n".join(code_lines)
            code_label = get_language_label(lang_hint)

            # Cabeçalho do bloco de código
            story.append(Paragraph(f"<b><font color='#0284c7'>▶ {code_label}</font></b>", code_header_style))
            # Bloco de código com quebra automática entre páginas
            story.append(Preformatted(code_text, code_text_style))
            story.append(Spacer(1, 4))
            continue

        # Imagem Markdown ![alt](path)
        img_match = re.match(r'!\[(.*?)\]\((.*?)\)', line.strip())
        if img_match:
            img_alt = img_match.group(1)
            img_path = img_match.group(2)
            if not os.path.isabs(img_path):
                img_path = os.path.normpath(os.path.join(os.path.dirname(md_file_path), img_path))
            if os.path.exists(img_path):
                try:
                    img_reader = ImageReader(img_path)
                    orig_w, orig_h = img_reader.getSize()
                    aspect = orig_h / orig_w
                    target_w = 490.0
                    target_h = target_w * aspect
                    if target_h > 230.0:
                        target_h = 230.0
                        target_w = target_h / aspect

                    img = RLImage(img_path, width=target_w, height=target_h)
                    story.append(Spacer(1, 4))
                    story.append(img)
                    story.append(Paragraph(f"<i>Figura: {img_alt}</i>", ParagraphStyle('ImgCaption', parent=body_style, fontSize=7.5, alignment=1, textColor=colors.HexColor("#64748b"))))
                    story.append(Spacer(1, 6))
                except Exception as e:
                    print(f"Aviso ao carregar imagem {img_path}: {e}")
            i += 1
            continue

        # Tabela Markdown
        if line.strip().startswith('|') and '|' in line.strip()[1:]:
            table_raw_rows = []
            while i < total_lines and lines[i].strip().startswith('|'):
                table_raw_rows.append(lines[i].strip())
                i += 1

            if len(table_raw_rows) >= 2:
                parsed_table_data = []
                for r_idx, r_str in enumerate(table_raw_rows):
                    if re.match(r'^\|[\s\:\-\|]+$', r_str):
                        continue
                    cells = [c.strip() for c in r_str.strip('|').split('|')]
                    is_header = (r_idx == 0)
                    row_cells = []
                    for c in cells:
                        fmt_c = parse_inline_markdown(c)
                        c_style = table_header_style if is_header else table_cell_style
                        row_cells.append(Paragraph(fmt_c, c_style))
                    parsed_table_data.append(row_cells)

                if parsed_table_data:
                    num_cols = max(len(r) for r in parsed_table_data)
                    for r in parsed_table_data:
                        while len(r) < num_cols:
                            r.append(Paragraph('', table_cell_style))

                    avail_width = 504.0
                    col_w = avail_width / num_cols
                    col_widths = [col_w] * num_cols

                    t = Table(parsed_table_data, colWidths=col_widths, repeatRows=1)
                    t_style = [
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0284c7")),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                        ('TOPPADDING', (0, 0), (-1, -1), 4),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                        ('LEFTPADDING', (0, 0), (-1, -1), 5),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                    ]
                    for row_i in range(1, len(parsed_table_data)):
                        bg_color = colors.HexColor("#ffffff") if row_i % 2 != 0 else colors.HexColor("#f8fafc")
                        t_style.append(('BACKGROUND', (0, row_i), (-1, row_i), bg_color))

                    t.setStyle(TableStyle(t_style))
                    story.append(t)
                    story.append(Spacer(1, 6))
            continue

        if not line.strip():
            i += 1
            continue

        # Formatações de Texto e Títulos
        formatted = parse_inline_markdown(line)

        if line.startswith('# '):
            story.append(Paragraph(formatted[2:], title_style))
            story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=8))
        elif line.startswith('## '):
            story.append(Paragraph(formatted[3:], h1_style))
        elif line.startswith('### '):
            story.append(Paragraph(formatted[4:], h2_style))
        elif line.startswith('#### '):
            story.append(Paragraph(formatted[5:], h3_style))
        elif line.startswith('---'):
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceBefore=4, spaceAfter=6))
        elif line.startswith('- ') or line.startswith('* '):
            story.append(Paragraph(f"• {formatted[2:]}", bullet_style))
        else:
            story.append(Paragraph(formatted, body_style))

        i += 1

    custom_canvas = make_canvas_class(delivery_header_title)
    doc.build(story, canvasmaker=custom_canvas)
    print(f"✔ PDF gerado com sucesso: {output_pdf_path}")


def main():
    deliveries = [
        {
            "md": "/Users/daniel/ifmg/io-sensor/alerta-temperatura/docs/entrega-2/Entrega_2_Conectividade_e_Resiliencia_WiFi.md",
            "pdf": "/Users/daniel/ifmg/io-sensor/alerta-temperatura/docs/entrega-2/Entrega_2_Conectividade_e_Resiliencia_WiFi.pdf",
            "title": "Entrega 2 — Conectividade e Resiliência Wi-Fi"
        },
        {
            "md": "/Users/daniel/ifmg/io-sensor/alerta-temperatura/docs/entrega-3/Entrega_3_Comunicacao_MQTT_e_Controle_Remoto.md",
            "pdf": "/Users/daniel/ifmg/io-sensor/alerta-temperatura/docs/entrega-3/Entrega_3_Comunicacao_MQTT_e_Controle_Remoto.pdf",
            "title": "Entrega 3 — Comunicação MQTT e Controle Remoto"
        },
        {
            "md": "/Users/daniel/ifmg/io-sensor/alerta-temperatura/docs/entrega-4/Entrega_4_Gateway_MQTT_e_Processamento.md",
            "pdf": "/Users/daniel/ifmg/io-sensor/alerta-temperatura/docs/entrega-4/Entrega_4_Gateway_MQTT_e_Processamento.pdf",
            "title": "Entrega 4 — Gateway MQTT e Processamento de Mensagens"
        },
        {
            "md": "/Users/daniel/ifmg/io-sensor/alerta-temperatura/docs/entrega-5/Entrega_5_Persistencia_Redis_Historico_e_Presenca.md",
            "pdf": "/Users/daniel/ifmg/io-sensor/alerta-temperatura/docs/entrega-5/Entrega_5_Persistencia_Redis_Historico_e_Presenca.pdf",
            "title": "Entrega 5 — Persistência no Redis, Histórico e Presença"
        },
        {
            "md": "/Users/daniel/ifmg/io-sensor/alerta-temperatura/docs/entrega-6/Entrega_6_Comunicacao_Bidirecional_e_Confirmacao.md",
            "pdf": "/Users/daniel/ifmg/io-sensor/alerta-temperatura/docs/entrega-6/Entrega_6_Comunicacao_Bidirecional_e_Confirmacao.pdf",
            "title": "Entrega 6 — Comunicação Bidirecional e Confirmação de Comandos"
        },
    ]

    print("==================================================")
    print("Compilando Documentos PDF Oficiais (Entregas 2 a 6)")
    print("==================================================")

    for item in deliveries:
        build_delivery_pdf(item["md"], item["pdf"], item["title"])

    print("\nTodos os PDFs foram compilados com sucesso!")

if __name__ == '__main__':
    main()
