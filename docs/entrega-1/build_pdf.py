import os
import re
from fpdf import FPDF

class PDFDoc(FPDF):
    def header(self):
        self.set_font('Helvetica', 'B', 8)
        self.set_text_color(100, 116, 139)
        self.cell(0, 10, 'Arquitetura de IoT - Entrega 1: Planejamento e Arquitetura do Projeto', 0, 0, 'L')
        self.cell(0, 10, 'Página ' + str(self.page_no()) + '/{nb}', 0, 0, 'R')
        self.ln(12)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(148, 163, 184)
        self.cell(0, 10, 'Sistema de Alerta de Temperatura e Saúde Ambiental IoT', 0, 0, 'C')

def convert_md_to_pdf(md_path, pdf_path):
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    pdf = PDFDoc()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    
    # Adiciona fontes padrão
    pdf.set_font("Helvetica", size=10)

    lines = content.split('\n')
    in_code_block = False
    code_lines = []

    for line in lines:
        raw_line = line.rstrip()

        # Quebra de página manual
        if '<div style="page-break-after: always;"></div>' in raw_line:
            pdf.add_page()
            continue

        # Blocos de código ou diagramas textuais
        if raw_line.startswith('```'):
            if in_code_block:
                # Fecha o bloco de código
                in_code_block = False
                pdf.set_font('Courier', size=7.5)
                pdf.set_fill_color(15, 23, 42) # Slate 900
                pdf.set_text_color(226, 232, 240) # Slate 200
                
                code_text = "\n".join(code_lines)
                # Garante que não estoure margens
                pdf.multi_cell(0, 4.5, code_text, border=1, fill=True)
                pdf.set_text_color(30, 41, 59)
                pdf.set_font('Helvetica', size=10)
                pdf.ln(3)
                code_lines = []
            else:
                in_code_block = True
                code_lines = []
            continue

        if in_code_block:
            # Substitui caracteres especiais não suportados pela fonte standard latin-1
            cleaned_code = raw_line.encode('latin-1', 'replace').decode('latin-1')
            code_lines.append(cleaned_code)
            continue

        # Títulos
        if raw_line.startswith('# '):
            pdf.ln(4)
            pdf.set_font('Helvetica', 'B', 16)
            pdf.set_text_color(15, 23, 42) # Slate 900
            text = raw_line[2:].encode('latin-1', 'replace').decode('latin-1')
            pdf.cell(0, 10, text, ln=True)
            pdf.set_draw_color(56, 189, 248) # Sky blue line
            pdf.set_line_width(0.8)
            pdf.line(pdf.get_x(), pdf.get_y(), pdf.get_x() + 180, pdf.get_y())
            pdf.ln(4)
            pdf.set_font('Helvetica', size=10)
        elif raw_line.startswith('## '):
            pdf.ln(3)
            pdf.set_font('Helvetica', 'B', 13)
            pdf.set_text_color(30, 41, 59) # Slate 800
            text = raw_line[3:].encode('latin-1', 'replace').decode('latin-1')
            pdf.cell(0, 8, text, ln=True)
            pdf.set_font('Helvetica', size=10)
        elif raw_line.startswith('### '):
            pdf.ln(2)
            pdf.set_font('Helvetica', 'B', 11)
            pdf.set_text_color(51, 65, 85) # Slate 700
            text = raw_line[4:].encode('latin-1', 'replace').decode('latin-1')
            pdf.cell(0, 6, text, ln=True)
            pdf.set_font('Helvetica', size=10)
        elif raw_line.startswith('---'):
            pdf.ln(2)
            pdf.set_draw_color(226, 232, 240)
            pdf.set_line_width(0.3)
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            pdf.ln(3)
        elif raw_line.startswith('- ') or raw_line.startswith('* '):
            pdf.set_font('Helvetica', size=10)
            pdf.set_text_color(30, 41, 59)
            text = "• " + raw_line[2:].replace('**', '').encode('latin-1', 'replace').decode('latin-1')
            pdf.multi_cell(0, 5, text)
            pdf.ln(1)
        elif raw_line.startswith('|') and '|' in raw_line[1:]:
            # Linha de tabela (trata simplificadamente)
            if '---' in raw_line:
                continue
            pdf.set_font('Courier', 'B', 8)
            pdf.set_text_color(30, 41, 59)
            text = raw_line.replace('**', '').encode('latin-1', 'replace').decode('latin-1')
            pdf.multi_cell(0, 4, text)
            pdf.set_font('Helvetica', size=10)
        else:
            if raw_line.strip() == "":
                pdf.ln(2)
            else:
                pdf.set_font('Helvetica', size=10)
                pdf.set_text_color(30, 41, 59)
                clean_text = raw_line.replace('**', '').replace('`', '').encode('latin-1', 'replace').decode('latin-1')
                pdf.multi_cell(0, 5, clean_text)
                pdf.ln(1)

    pdf.output(pdf_path)
    print(f"PDF gerado com sucesso em: {pdf_path}")

if __name__ == '__main__':
    md_file = "/Users/daniel/ifmg/io-sensor/alerta-temperatura/docs/entrega-1/Entrega_1_Planejamento_e_Arquitetura_IoT.md"
    pdf_file = "/Users/daniel/ifmg/io-sensor/alerta-temperatura/docs/entrega-1/Entrega_1_Planejamento_e_Arquitetura_IoT.pdf"
    convert_md_to_pdf(md_file, pdf_file)
