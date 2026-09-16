# Sazono UI - Docs

## Orden recomendado

1. [01 Product Context UI](01-product-context-ui.md)
2. [02 Frontend Architecture](02-frontend-architecture.md)
3. [03 Frontend AI Context](03-frontend-ai-context.md)
4. [04 Implementation Plan](04-implementation-plan.md)
5. [05 Admin Dashboards and UX](05-admin-dashboards-and-ux.md)
6. [06 Mesero y Cocina](06-mesero-y-cocina.md)
7. [07 Split Bill y Abandono](07-split-bill-y-abandono.md)
8. [08 Vista Consolidada de Cuentas Abiertas](08-vista-consolidada-cuentas-abiertas.md)
9. [09 Huecos Incrementales](09-huecos-incrementales.md)
10. [10 Fase 5: Paquete de Carta](10-fase-5-paquete-de-carta.md)
11. [11 Fase 6: Control de Acceso por Sucursal y Login por Restaurante](11-fase-6-acceso-por-sucursal-y-login.md)
12. [12 Fase 7: Landing Marketera y Captura de Leads](12-fase-7-landing-marketera-y-leads.md)
13. [13 App Nativa de Mesero y Cocina: Decisión de Arquitectura (Capacitor)](13-app-mesero-capacitor.md)
14. [14 Fase 8: Mesas, Cocina y Modificadores](14-fase-8-mesas-cocina-y-modificadores.md)
15. [15 Fase 9: Simplificación de Mesas del Salón y Asignación Formal](15-fase-9-simplificacion-mesas-y-asignacion.md)
16. [16 Notificaciones Push y Login por PIN](16-notificaciones-push-y-login-por-pin.md)
17. [17 Fase 10: Comensales al Abrir Mesa y Zonas del Salón](17-comensales-y-zonas-de-mesa.md)
18. [18 Integración de Mercado Pago (Checkout con Tarjeta y Conexión de Cuenta)](18-mercado-pago-checkout.md)
19. [19 Transbank y Checkout Multi-Proveedor](19-transbank-y-checkout-multi-proveedor.md)
20. [20 Fix: Race Condition en Refresh de Sesión](20-fix-race-condition-refresh-sesion.md)

Nota: los docs 18 y 19 cubren solo el lado frontend de pagos (checkout,
selector de pasarela, panel de conexion). Para el mapa completo del sistema
de pagos (flujos de dinero, por que existen dos pasarelas, matriz de
capacidad flujo x proveedor, gaps conocidos consolidados) ver
`sazono-backend-monolith/docs/24-pagos-vision-general.md`.

## Objetivo

Estos documentos existen para que una IA que trabaje en el frontend tenga suficiente contexto de producto y arquitectura sin cargar detalles internos del backend que no necesita para avanzar.
