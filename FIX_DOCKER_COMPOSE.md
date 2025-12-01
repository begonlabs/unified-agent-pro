# Así debería verse en tu docker-compose.yml

# Busca la sección que dice "# dLocalGo variables" (líneas 351-354)
# Y reemplázala con esto (SIN los # al inicio):

    # dLocalGo variables
    DLOCALGO_API_KEY: TWknwsAtJgazlDsawRIrCYLFJpJNOYMR
    DLOCALGO_SECRET_KEY: ApizLughS0RbihFquK651wpQoJmK9rJUpagMrUBg
    DLOCALGO_API_URL: https://api-sbx.dlocalgo.com
    PUBLIC_URL: https://ondai.ai

# IMPORTANTE: 
# - La línea "# dLocalGo variables" SÍ puede tener # (es un comentario)
# - Pero las siguientes 4 líneas NO deben tener # al inicio
# - Deben tener la misma indentación que las variables de arriba (WHATSAPP_API_KEY, etc.)

# Ejemplo completo de cómo debería verse:

    WHATSAPP_API_KEY: ${OPENAI_API_KEY}
    # dLocalGo variables
    DLOCALGO_API_KEY: TWknwsAtJgazlDsawRIrCYLFJpJNOYMR
    DLOCALGO_SECRET_KEY: ApizLughS0RbihFquK651wpQoJmK9rJUpagMrUBg
    DLOCALGO_API_URL: https://api-sbx.dlocalgo.com
    PUBLIC_URL: https://ondai.ai
