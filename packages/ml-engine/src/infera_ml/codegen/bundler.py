import io
import zipfile

def create_deployment_bundle(files: dict[str, str | bytes]) -> bytes:
    """
    Packages a dictionary of files into a ZIP archive.
    files: dict where keys are relative paths (e.g., 'src/main.cpp') 
           and values are file contents (string or bytes).
    """
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for filepath, content in files.items():
            if isinstance(content, str):
                zip_file.writestr(filepath, content.encode('utf-8'))
            else:
                zip_file.writestr(filepath, content)
                
    return zip_buffer.getvalue()
