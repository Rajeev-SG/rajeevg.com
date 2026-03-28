#!/usr/bin/env python3

from __future__ import annotations

import json
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET


WORKBOOK_PATH = Path("/Users/rajeev/Code/rajeevg.com/docs/rajeevg_master_content_matrix_system_view.xlsx")
OUTPUT_PATH = Path("/Users/rajeev/Code/rajeevg.com/src/data/content-ops/workbook.json")

NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "p": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def normalize_header(value: str, index: int) -> str:
    text = (value or "").strip()
    if text:
        return text
    return f"column_{index + 1}"


def normalize_row(row: dict[str, str], index: int) -> dict[str, str]:
    normalized = {"_row": index + 1}
    normalized.update(row)
    return normalized


def parse_workbook(path: Path) -> dict[str, object]:
    with ZipFile(path) as archive:
        shared_strings: list[str] = []

        if "xl/sharedStrings.xml" in archive.namelist():
            shared_root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            for item in shared_root.findall("a:si", NS):
                shared_strings.append("".join((text.text or "") for text in item.iterfind(".//a:t", NS)))

        workbook_root = ET.fromstring(archive.read("xl/workbook.xml"))
        relationships_root = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        relationship_map = {
            rel.attrib["Id"]: rel.attrib["Target"].lstrip("/")
            for rel in relationships_root.findall("p:Relationship", NS)
        }

        sheets: dict[str, list[dict[str, str]]] = {}
        metadata: dict[str, dict[str, object]] = {}

        def get_cell_value(cell: ET.Element) -> str:
            value = cell.find("a:v", NS)
            inline = cell.find("a:is", NS)
            cell_type = cell.attrib.get("t")

            if value is not None:
                raw = value.text or ""
                if cell_type == "s":
                    return shared_strings[int(raw)]
                return raw

            if inline is not None:
                return "".join((text.text or "") for text in inline.iterfind(".//a:t", NS))

            return ""

        for sheet in workbook_root.find("a:sheets", NS) or []:
            name = sheet.attrib["name"]
            target = relationship_map[sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]]
            sheet_root = ET.fromstring(archive.read(target))
            raw_rows: list[list[str]] = []

            for row in sheet_root.findall(".//a:sheetData/a:row", NS):
                values = [get_cell_value(cell).strip() for cell in row.findall("a:c", NS)]
                raw_rows.append(values)

            header_scan = raw_rows[: min(len(raw_rows), 12)]
            header_row_index = 0
            if header_scan:
                scored_rows = [
                    (index, sum(1 for cell in row if cell.strip()))
                    for index, row in enumerate(header_scan)
                ]
                header_row_index = max(scored_rows, key=lambda item: item[1])[0]
            header_row = raw_rows[header_row_index] if raw_rows else []
            headers = [normalize_header(value, index) for index, value in enumerate(header_row)]

            records: list[dict[str, str]] = []
            for raw_index, row in enumerate(raw_rows[header_row_index + 1 :], start=header_row_index + 1):
                if not any(cell.strip() for cell in row):
                    continue

                record = {
                    header: (row[index] if index < len(row) else "").strip()
                    for index, header in enumerate(headers)
                }
                records.append(normalize_row(record, raw_index))

            sheets[name] = records
            metadata[name] = {
                "headerRow": header_row_index + 1,
                "headers": headers,
                "rowCount": len(records),
            }

        return {
            "source": str(path),
            "sheetOrder": list(sheets.keys()),
            "metadata": metadata,
            "sheets": sheets,
        }


def main() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    workbook = parse_workbook(WORKBOOK_PATH)
    OUTPUT_PATH.write_text(json.dumps(workbook, indent=2), encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
