# 📐 Диаграммы для диплома — La Bella Italia

## Структура

| Файл | Формат | Назначение | Инструмент |
|:-----|:-------|:-----------|:-----------|
| `er_diagram.dbml` | DBML | ER-диаграмма базы данных | [dbdiagram.io](https://dbdiagram.io) |
| `er_diagram.sql` | SQL | CREATE TABLE + комментарии | Любой SQL-редактор |
| `use_case.puml` | PlantUML | Варианты использования (роли) | [planttext.com](https://www.planttext.com) |
| `architecture.puml` | PlantUML | Архитектура системы | [planttext.com](https://www.planttext.com) |
| `sequence_order.puml` | PlantUML | Последовательность заказа | [planttext.com](https://www.planttext.com) |
| `dfd.puml` | PlantUML | DFD (потоки данных) Level 0 и Level 1 | [planttext.com](https://www.planttext.com) |

---

## 🎨 Как получить готовую картинку

### Способ 1: PlantText (самый быстрый)

1. Откройте [https://www.planttext.com](https://www.planttext.com)
2. Скопируйте содержимое `.puml` файла целиком
3. Вставьте в левую панель
4. Справа сразу появится диаграмма
5. Нажмите **PNG / SVG** → скачать

### Способ 2: VS Code

1. Установите плагин **PlantUML** (jebbs.plantuml)
2. Откройте `.puml` файл
3. Нажмите `Alt+D` — диаграмма откроется в preview

### Способ 3: dbdiagram.io (только ER)

1. Откройте [https://dbdiagram.io](https://dbdiagram.io)
2. Создайте новый документ
3. Скопируйте содержимое `er_diagram.dbml`
4. Вставьте в редактор
5. Нажмите **Export as Image**

### Способ 4: draw.io

1. Откройте [https://app.diagrams.net](https://app.diagrams.net)
2. File → Import → Выберите DBML/SQL файл
3. Или создайте вручную, используя как справочник

---

## 📋 Рекомендации для вставки в диплом

| Диаграмма | Размер на листе | Глава |
|:----------|:----------------|:------|
| ER | Половина A4 | 1.4 (или 2.2) |
| Use Case | Половина A4 | 1.3 (Функциональные требования) |
| Архитектура | Половина A4 | 2.1 (Архитектура) |
| Sequence | Целый A4 (альбомный) | 2.4 (Реализация заказа) |
| DFD | Целый A4 | 2.2 (Проектирование архитектуры) |

---

## 🔗 Полезные ссылки

- **PlantUML Guide:** https://plantuml.com/ru/
- **DBML docs:** https://www.dbml.org/docs/
- **Рисовать онлайн (все форматы):** https://app.diagrams.net
