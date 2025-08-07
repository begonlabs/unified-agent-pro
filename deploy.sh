#!/bin/bash

# 🚀 Script de Despliegue Automático para OndAI Frontend
# Autor: OndAI Team
# Descripción: Automatiza el pull, build y despliegue del frontend en VPS

set -e  # Salir si cualquier comando falla

# Colores para logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuración
PROJECT_NAME="ondai-frontend"
CONTAINER_NAME="ondai-frontend"
COMPOSE_FILE="docker compose.yml"
GIT_BRANCH="main"
BACKUP_DIR="/opt/ondai/backups"
LOG_FILE="/var/log/ondai-deploy.log"

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a $LOG_FILE
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a $LOG_FILE
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a $LOG_FILE
}

# Función para crear backup
create_backup() {
    log "Creando backup antes del despliegue..."
    
    # Crear directorio de backup si no existe
    mkdir -p $BACKUP_DIR
    
    # Nombre del backup con timestamp
    BACKUP_NAME="ondai-backup-$(date +'%Y%m%d-%H%M%S')"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    # Crear backup del volumen de datos (si existe)
    if docker volume ls | grep -q "ondai_nginx-logs"; then
        docker run --rm -v ondai_nginx-logs:/source -v $BACKUP_DIR:/backup alpine tar czf /backup/$BACKUP_NAME-logs.tar.gz -C /source .
        log_success "Backup de logs creado: $BACKUP_NAME-logs.tar.gz"
    fi
    
    # Mantener solo los últimos 5 backups
    cd $BACKUP_DIR
    ls -t | tail -n +6 | xargs -r rm --
    log_success "Limpieza de backups antiguos completada"
}

# Función para verificar prerequisites
check_prerequisites() {
    log "Verificando prerequisites del sistema..."
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker no está instalado"
        exit 1
    fi
    
    # Verificar Docker Compose
    if ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose no está instalado"
        exit 1
    fi
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        log_error "Git no está instalado"
        exit 1
    fi
    
    log_success "Todos los prerequisites están instalados"
}

# Función para actualizar código
update_code() {
    log "Actualizando código desde Git..."
    
    # Verificar si estamos en un repositorio Git
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_warning "No se detectó repositorio Git. Saltando actualización de código..."
        log_warning "Para usar Git, asegúrate de estar en un directorio clonado con 'git clone'"
        return 0
    fi
    
    # Verificar si hay conexión a internet y al remote
    if ! git ls-remote origin > /dev/null 2>&1; then
        log_warning "No se puede conectar al repositorio remoto. Saltando actualización..."
        return 0
    fi
    
    # Guardar cambios locales si existen
    if [[ $(git status --porcelain 2>/dev/null) ]]; then
        log_warning "Detectados cambios locales, creando stash..."
        git stash push -m "Auto-stash before deploy $(date)"
    fi
    
    # Fetch y pull
    git fetch origin
    git checkout $GIT_BRANCH
    git pull origin $GIT_BRANCH
    
    log_success "Código actualizado desde $GIT_BRANCH"
}

# Función para construir imagen
build_image() {
    log "Construyendo nueva imagen Docker..."
    
    # Construir imagen con caché
    docker compose -f $COMPOSE_FILE build --no-cache ondai-frontend
    
    log_success "Imagen construida exitosamente"
}

# Función para desplegar aplicación
deploy_application() {
    log "Desplegando aplicación..."
    
    # Parar contenedores existentes
    log "Deteniendo contenedores existentes..."
    docker compose -f $COMPOSE_FILE down
    
    # Iniciar nuevos contenedores
    log "Iniciando nuevos contenedores..."
    docker compose -f $COMPOSE_FILE up -d
    
    log_success "Aplicación desplegada exitosamente"
}

# Función para verificar salud
health_check() {
    log "Verificando salud de la aplicación..."
    
    # Esperar a que el contenedor esté listo
    sleep 30
    
    # Verificar que el contenedor esté corriendo
    if ! docker ps | grep -q $CONTAINER_NAME; then
        log_error "El contenedor no está corriendo"
        exit 1
    fi
    
    # Verificar health check
    max_attempts=10
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "Intento de health check $attempt/$max_attempts..."
        
        if curl -f http://localhost:3000/health &> /dev/null; then
            log_success "Health check exitoso - Aplicación funcionando correctamente"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    log_error "Health check falló después de $max_attempts intentos"
    
    # Mostrar logs para debugging
    log "Mostrando logs del contenedor para debugging:"
    docker logs $CONTAINER_NAME --tail 50
    
    exit 1
}

# Función para limpiar recursos
cleanup() {
    log "Limpiando recursos no utilizados..."
    
    # Limpiar imágenes dangling
    docker image prune -f
    
    # Limpiar volúmenes no utilizados
    docker volume prune -f
    
    log_success "Limpieza completada"
}

# Función para mostrar información del despliegue
show_deploy_info() {
    log_success "🎉 Despliegue completado exitosamente!"
    echo ""
    echo -e "${PURPLE}==================== INFORMACIÓN DEL DESPLIEGUE ====================${NC}"
    echo -e "${GREEN}🌐 Aplicación:${NC} OndAI Frontend"
    echo -e "${GREEN}🐳 Contenedor:${NC} $CONTAINER_NAME"
    echo -e "${GREEN}🔗 URL Local:${NC} http://localhost:3000"
    echo -e "${GREEN}📊 Health Check:${NC} http://localhost:3000/health"
    echo -e "${GREEN}📝 Logs:${NC} docker logs $CONTAINER_NAME -f"
    echo -e "${GREEN}🔄 Estado:${NC} $(docker ps --format 'table {{.Names}}\t{{.Status}}' | grep $CONTAINER_NAME)"
    echo -e "${PURPLE}=================================================================${NC}"
    echo ""
}

# Función para rollback
rollback() {
    log_warning "Iniciando rollback..."
    
    # Obtener la imagen anterior
    PREVIOUS_IMAGE=$(docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}" | grep $PROJECT_NAME | sed -n '2p' | awk '{print $1":"$2}')
    
    if [[ -n "$PREVIOUS_IMAGE" ]]; then
        log "Haciendo rollback a imagen: $PREVIOUS_IMAGE"
        
        # Cambiar la imagen en docker compose y redesplegar
        docker compose -f $COMPOSE_FILE down
        docker tag $PREVIOUS_IMAGE ${PROJECT_NAME}:latest
        docker compose -f $COMPOSE_FILE up -d
        
        log_success "Rollback completado"
    else
        log_error "No se encontró imagen anterior para rollback"
        exit 1
    fi
}

# Función principal
main() {
    echo -e "${PURPLE}"
    echo "  ██████  ███▄    █ ▓█████▄  ▄▄▄       ██▓"
    echo "▒██    ▒  ██ ▀█   █ ▒██▀ ██▌▒████▄    ▓██▒"
    echo "░ ▓██▄   ▓██  ▀█ ██▒░██   █▌▒██  ▀█▄  ▒██▒"
    echo "  ▒   ██▒▓██▒  ▐▌██▒░▓█▄   ▌░██▄▄▄▄██ ░██░"
    echo "▒██████▒▒▒██░   ▓██░░▒████▓  ▓█   ▓██▒░██░"
    echo "▒ ▒▓▒ ▒ ░░ ▒░   ▒ ▒  ▒▒▓  ▒  ▒▒   ▓▒█░░▓  "
    echo "░ ░▒  ░ ░░ ░░   ░ ▒░ ░ ▒  ▒   ▒   ▒▒ ░ ▒ ░"
    echo "░  ░  ░     ░   ░ ░  ░ ░  ░   ░   ▒    ▒ ░"
    echo "      ░           ░    ░          ░  ░ ░  "
    echo "                     ░                    "
    echo -e "${NC}"
    echo -e "${BLUE}🚀 Script de Despliegue Automático - OndAI Frontend${NC}"
    echo -e "${BLUE}=================================================${NC}"
    echo ""
    
    # Verificar argumentos
    case "${1:-deploy}" in
        "deploy")
            log "Iniciando despliegue completo..."
            check_prerequisites
            create_backup
            update_code
            build_image
            deploy_application
            health_check
            cleanup
            show_deploy_info
            ;;
        "local")
            log "Iniciando despliegue local (sin Git)..."
            check_prerequisites
            create_backup
            log_warning "Saltando actualización de Git (modo local)"
            build_image
            deploy_application
            health_check
            cleanup
            show_deploy_info
            ;;
        "quick")
            log "Iniciando despliegue rápido (solo restart)..."
            check_prerequisites
            docker compose -f $COMPOSE_FILE restart ondai-frontend
            health_check
            log_success "Despliegue rápido completado"
            ;;
        "rollback")
            rollback
            ;;
        "logs")
            docker logs $CONTAINER_NAME -f
            ;;
        "status")
            docker compose -f $COMPOSE_FILE ps
            ;;
        "stop")
            log "Deteniendo aplicación..."
            docker compose -f $COMPOSE_FILE down
            log_success "Aplicación detenida"
            ;;
        "start")
            log "Iniciando aplicación..."
            docker compose -f $COMPOSE_FILE up -d
            health_check
            log_success "Aplicación iniciada"
            ;;
        *)
            echo "Uso: $0 {deploy|local|quick|rollback|logs|status|stop|start}"
            echo ""
            echo "Comandos disponibles:"
            echo "  deploy   - Despliegue completo (git pull + build + deploy)"
            echo "  local    - Despliegue local (sin Git, solo build + deploy)"
            echo "  quick    - Despliegue rápido (solo restart)"
            echo "  rollback - Volver a la versión anterior"
            echo "  logs     - Ver logs en tiempo real"
            echo "  status   - Ver estado de contenedores"
            echo "  stop     - Detener aplicación"
            echo "  start    - Iniciar aplicación"
            exit 1
            ;;
    esac
}

# Manejo de errores
trap 'log_error "Script falló en línea $LINENO. Saliendo..."; exit 1' ERR

# Ejecutar función principal
main "$@"