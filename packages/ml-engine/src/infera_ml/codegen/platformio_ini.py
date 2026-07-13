import jinja2

def generate_platformio_ini(board_spec: dict) -> str:
    template = """[env:{{ env_name }}]
platform = {{ platform }}
board = {{ board }}
framework = {{ framework }}
monitor_speed = 115200

build_flags =
{% for flag in build_flags %}
    {{ flag }}
{% endfor %}

lib_deps =
    ; Add required libraries (e.g., TFLM)
"""
    env = jinja2.Environment()
    t = env.from_string(template)
    
    pio = board_spec.get("platformio", {})
    return t.render(
        env_name=board_spec.get("target", "custom_board"),
        platform=pio.get("platform", "espressif32"),
        board=pio.get("board", "esp32dev"),
        framework=pio.get("framework", "arduino"),
        build_flags=pio.get("build_flags", [])
    )
