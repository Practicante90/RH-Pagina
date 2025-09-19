from flask import Flask, request, jsonify
import zipfile
import os
import shutil
from werkzeug.utils import secure_filename
import smtplib
from email.message import EmailMessage

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

@app.route('/procesar', methods=['POST'])
def procesar():
    zip_file = request.files['zipfile']
    imagenes = request.files.getlist('imagenes')
    zip_path = os.path.join(UPLOAD_FOLDER, secure_filename(zip_file.filename))
    zip_file.save(zip_path)

    # Descomprimir ZIP
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(PROCESSED_FOLDER)

    # Guardar imágenes
    imagen_paths = []
    for img in imagenes:
        img_path = os.path.join(PROCESSED_FOLDER, secure_filename(img.filename))
        img.save(img_path)
        imagen_paths.append(img_path)

    # Aquí deberías mostrar al usuario los archivos descomprimidos y permitirle elegir dónde pegar las imágenes.
    # Por simplicidad, este ejemplo solo asume que se pega la primera imagen en el primer archivo.

    archivos = [f for f in os.listdir(PROCESSED_FOLDER) if os.path.isfile(os.path.join(PROCESSED_FOLDER, f))]
    if archivos and imagen_paths:
        # Ejemplo: copiar la imagen al lado del archivo
        shutil.copy(imagen_paths[0], os.path.join(PROCESSED_FOLDER, f"{archivos[0]}_img{os.path.splitext(imagen_paths[0])[1]}"))

    # Leer CURP del archivo (ejemplo: buscar en el texto)
    curp = None
    for archivo in archivos:
        with open(os.path.join(PROCESSED_FOLDER, archivo), 'r', encoding='utf-8', errors='ignore') as f:
            contenido = f.read()
            # Busca la CURP (ejemplo: 18 caracteres alfanuméricos)
            import re
            match = re.search(r'\b[A-Z0-9]{18}\b', contenido)
            if match:
                curp = match.group()
                break

    # Buscar correo por CURP (esto depende de tu base de datos, aquí es ejemplo)
    correo_destino = buscar_correo_por_curp(curp) if curp else None

    # Enviar correo con archivos adjuntos
    if correo_destino:
        enviar_correo(correo_destino, archivos, PROCESSED_FOLDER)

    return jsonify({"status": "ok", "curp": curp, "correo": correo_destino})

def buscar_correo_por_curp(curp):
    # Aquí deberías consultar tu base de datos
    # Ejemplo fijo:
    return "destinatario@ejemplo.com"

def enviar_correo(destino, archivos, carpeta):
    msg = EmailMessage()
    msg['Subject'] = 'Archivos procesados'
    msg['From'] = 'tu_correo@ejemplo.com'
    msg['To'] = destino
    msg.set_content('Adjunto los archivos procesados.')

    for archivo in archivos:
        with open(os.path.join(carpeta, archivo), 'rb') as f:
            msg.add_attachment(f.read(), maintype='application', subtype='octet-stream', filename=archivo)

    # Configura tu servidor SMTP aquí
    with smtplib.SMTP('smtp.tu-servidor.com', 587) as s:
        s.starttls()
        s.login('usuario', 'contraseña')
        s.send_message(msg)

if __name__ == '__main__':
    app.run(port=5100, debug=True)