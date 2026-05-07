import PyPDF2

def extract_text(pdf_path):
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text

if __name__ == '__main__':
    pdf_path = r"c:\Users\Lenovo\Downloads\simmam\pdf\list of events.pdf"
    text = extract_text(pdf_path)
    with open("parsed_events.txt", "w", encoding="utf-8") as out:
        out.write(text)
    print("Done")
