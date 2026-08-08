# Changelog: Inventory Module (Lanchonete + Loja)

## [2026-08-08]
- **IMPL:** Módulos Lanchonete e Loja implementados como um único módulo `inventory` parametrizado por canal (`SNACKBAR` / `STORE`).
- **Decisão:** Unificação de estrutura idêntica — evita duplicar tabelas e código. Canais distinguidos por coluna `channel` no banco, segmento `:channel` na URL e prop no frontend. Ver `docs/inventory_module_structure.md`.
- **Banco:** Migration `20260808000002_create_inventory.sql` — enum `inventory_channel`, tabelas `inventory_products` (catálogo + estoque) e `inventory_sales` (vendas com snapshot de preço + `tab_id` opcional).
- **Backend:** `inventory.types`, `inventory.schemas` (Zod + parsing de canal/faixa/limite), `inventory.repository` (CRUD + agregações de relatório com helper `relationOne`), `inventory.service` (regras de estoque e produto ativo), `inventory.controller`, `inventory.routes`. Registrado em `app.ts` e `server.ts`.
- **Frontend:** `types.ts`, `format.ts`, `api/inventoryApi.ts`, componentes `InventoryPanel` (abas Venda/Produtos/Relatórios), `ProductForm`, `ProductRow` (ajuste de estoque inline), `SalePosForm` (PDV), `ReportsPanel` (faturamento + mais vendidos + por categoria, por período).
- **Navegação:** `App.tsx` ganhou abas no header (Operação / Lanchonete / Loja).
- **Verificação:** `tsc --noEmit` limpo em backend e frontend; 6 testes de backend passando.
- **Status:** Completo. Cobre estoque, cadastro, custo, venda, faturamento (dia/mês/ano), mais vendidos e por categoria. Comparativos/projeção ficam no módulo de Gráficos.
