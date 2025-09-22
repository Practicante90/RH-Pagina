import os
import zipfile
import re
import pyodbc
import fitz  
from flask import Flask, request, jsonify, render_template, send_from_directory, abort
from flask_cors import CORS
from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader
import smtplib
from email.message import EmailMessage

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
PICTURES_FOLDER = 'pictures'  

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)
os.makedirs(PICTURES_FOLDER, exist_ok=True)

DB_CONN_STR = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=192.168.0.115;"
    "DATABASE=RH;"
    "UID=sa;"
    "PWD=fischer2025;"
)

app = Flask(__name__, template_folder='page')
CORS(app)

def incrustar_imagenes(pdf_path):
    doc = fitz.open(pdf_path)
    try:
        page = doc[0]  
        logo_path = os.path.join(PICTURES_FOLDER, "logo.png")
        if os.path.exists(logo_path):
            rect_logo = fitz.Rect(30, 30, 200, 120)
            page.insert_image(rect_logo, filename=logo_path, keep_proportion=True)

        mg_path = os.path.join(PICTURES_FOLDER, "MG.png")
        if os.path.exists(mg_path):
            areas = page.search_for("Patrón o representante legal")
            if areas:
                ref = areas[0]
                shift_left = 20
                rect_mg = fitz.Rect(ref.x0 - shift_left, ref.y1 + 10, ref.x0 + 120 - shift_left, ref.y1 + 50)
                page.insert_image(rect_mg, filename=mg_path, keep_proportion=True)

        kt_path = os.path.join(PICTURES_FOLDER, "KT.png")
        if os.path.exists(kt_path):
            areas = page.search_for("Representante de los trabajadores")
            if areas:
                ref = areas[0]
                rect_kt = fitz.Rect(ref.x0, ref.y1 + 10, ref.x0 + 120, ref.y1 + 50)
                page.insert_image(rect_kt, filename=kt_path, keep_proportion=True)

        ul_path = os.path.join(PICTURES_FOLDER, "UL.png")
        if os.path.exists(ul_path):
            areas_capacitador = page.search_for("Capacitador")
            if areas_capacitador:
                last_ref = max(areas_capacitador, key=lambda r: r.y0)
                shift_left = 50 
                rect_ul = fitz.Rect(last_ref.x0 - shift_left, last_ref.y1 + 10,
                                    last_ref.x0 + 120 - shift_left, last_ref.y1 + 50)
                page.insert_image(rect_ul, filename=ul_path, keep_proportion=True)
        print(f"✅ Imágenes insertadas en {pdf_path}")
    except Exception as e:
        print(f"⚠️ Error insertando imágenes en {pdf_path}: {e}")
    finally:
        temp_path = pdf_path + "_temp.pdf"
        doc.save(temp_path)
        doc.close()
        os.replace(temp_path, pdf_path)

def extraer_curp_de_archivos(carpeta, archivos):
    for archivo in archivos:
        ruta = os.path.join(carpeta, archivo)
        texto = ""
        if archivo.lower().endswith(".pdf"):
            try:
                reader = PdfReader(ruta)
                for page in reader.pages:
                    texto += page.extract_text() or ""
            except Exception as e:
                print(f"⚠️ No se pudo leer el PDF {archivo}: {e}")
        elif archivo.lower().endswith(".txt"):
            try:
                with open(ruta, 'r', encoding='utf-8', errors='ignore') as f:
                    texto = f.read()
            except Exception as e:
                print(f"⚠️ No se pudo leer el TXT {archivo}: {e}")
        match = re.search(r'\b[A-Z0-9]{18}\b', texto)
        if match:
            return match.group()
    return None

def buscar_correo_por_curp(curp):
    if not curp:
        return None
    try:
        conn = pyodbc.connect(DB_CONN_STR)
        cursor = conn.cursor()
        cursor.execute("SELECT email FROM Empleados WHERE curp = ?", curp)
        row = cursor.fetchone()
        conn.close()
        if row and row.email:
            return row.email
    except Exception as e:
        print("Error consultando la base de datos:", e)
    return None

def enviar_correo(destino, archivos, carpeta):
    msg = EmailMessage()
    msg['Subject'] = 'Archivos procesados'
    msg['From'] = 'tu_correo@ejemplo.com'
    msg['To'] = destino
    msg.set_content('Adjunto los archivos procesados.')
    for archivo in archivos:
        ruta = os.path.join(carpeta, archivo)
        try:
            with open(ruta, 'rb') as f:
                msg.add_attachment(
                    f.read(),
                    maintype='application',
                    subtype='octet-stream',
                    filename=archivo
                )
        except Exception as e:
            print(f"⚠️ No se pudo adjuntar el archivo {archivo}: {e}")
    try:
        with smtplib.SMTP('mail.fischer.com.mx', 465) as s:
            s.starttls()
            s.login('usuario', 'contraseña')  
            s.send_message(msg)
            print(f"✅ Correo enviado a {destino}")
    except Exception as e:
        print("Error enviando el correo:", e)

@app.route('/', defaults={'page_path': 'index.html'})
@app.route('/<path:page_path>')
def serve_html(page_path):
    if not page_path.lower().endswith('.html'):
        page_path += '.html'
    safe_path = os.path.join(app.template_folder, page_path)
    if not os.path.exists(safe_path):
        abort(404)
    return render_template(page_path)

@app.route('/Styles/<path:filename>')
def serve_css(filename):
    path = os.path.join('Styles', filename)
    if not os.path.exists(path):
        abort(404)
    return send_from_directory('Styles', filename)

@app.route('/code/<path:filename>')
def serve_js(filename):
    path = os.path.join('code', filename)
    if not os.path.exists(path):
        abort(404)
    return send_from_directory('code', filename)

@app.route('/processed/<path:filename>')
def serve_processed(filename):
    path = os.path.join(PROCESSED_FOLDER, filename)
    if not os.path.exists(path):
        abort(404)
    return send_from_directory(PROCESSED_FOLDER, filename)

@app.route('/procesar', methods=['POST'])
def procesar():
    zip_file = request.files['zipfile']
    zip_path = os.path.join(UPLOAD_FOLDER, secure_filename(zip_file.filename))
    zip_file.save(zip_path)

    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(PROCESSED_FOLDER)

    archivos = [
        f for f in os.listdir(PROCESSED_FOLDER)
        if os.path.isfile(os.path.join(PROCESSED_FOLDER, f))
    ]

    resultados = []

    for archivo in archivos:
        pdf_path = os.path.join(PROCESSED_FOLDER, archivo)
        if archivo.lower().endswith(".pdf"):
            incrustar_imagenes(pdf_path)
        curp = extraer_curp_de_archivos(PROCESSED_FOLDER, [archivo])
        correo = buscar_correo_por_curp(curp) if curp else None
        resultados.append({
            "nombre": archivo,
            "curp": curp or 'N/A',
            "correo": correo or 'N/A',
            "preview": f"/processed/{archivo}" if archivo.lower().endswith(".pdf") else None
        })

    return jsonify({
        "status": "ok",
        "archivos_preview": resultados
    })

@app.route('/enviar', methods=['POST'])
def enviar():
    data = request.json
    archivos = data.get("archivos", [])

    if archivos:
        for archivo in archivos:
            correo = buscar_correo_por_curp(extraer_curp_de_archivos(PROCESSED_FOLDER, [archivo]))
            if correo:
                enviar_correo(correo, [archivo], PROCESSED_FOLDER)
        return jsonify({"status": "ok", "mensaje": "Correos enviados"})
    return jsonify({"status": "error", "mensaje": "Faltan datos"}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5100)
