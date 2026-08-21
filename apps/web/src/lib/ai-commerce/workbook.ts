import { deflateSync } from "zlib";

function crc32(buf: Buffer): number {
  let crc = ~0;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]!;
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function zipFiles(files: Array<{ name: string; data: Buffer }>): Buffer {
  const chunks: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const file of files) {
    const compressed = deflateSync(file.data, { level: 9 });
    const crc = crc32(file.data);
    const name = Buffer.from(file.name);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(file.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    chunks.push(local, name, compressed);
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);
    cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(8, 10);
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(compressed.length, 20);
    cen.writeUInt32LE(file.data.length, 24);
    cen.writeUInt16LE(name.length, 28);
    cen.writeUInt32LE(offset, 42);
    central.push(cen, name);
    offset += 30 + name.length + compressed.length;
  }
  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, centralBuf, end]);
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type WorkbookSheet = { name: string; headers: string[]; rows: Array<Array<string | number | null>> };

export function buildXlsx(sheets: WorkbookSheet[]): Uint8Array {
  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}
</Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
  const wbRels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}
</Relationships>`;
  const workbook = `<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${sheets.map((s, i) => `<sheet name="${xmlEscape(s.name.slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>
</workbook>`;

  const files = [
    { name: "[Content_Types].xml", data: Buffer.from(contentTypes) },
    { name: "_rels/.rels", data: Buffer.from(rels) },
    { name: "xl/_rels/workbook.xml.rels", data: Buffer.from(wbRels) },
    { name: "xl/workbook.xml", data: Buffer.from(workbook) },
  ];
  sheets.forEach((sheet, idx) => {
    const all = [sheet.headers, ...sheet.rows];
    const sheetXml = `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>
${all
  .map((row, r) => {
    const cells = row
      .map((cell, c) => {
        const col = String.fromCharCode(65 + (c % 26));
        const ref = `${col}${r + 1}`;
        if (typeof cell === "number") return `<c r="${ref}" t="n"><v>${cell}</v></c>`;
        return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(String(cell ?? ""))}</t></is></c>`;
      })
      .join("");
    return `<row r="${r + 1}">${cells}</row>`;
  })
  .join("")}
</sheetData></worksheet>`;
    files.push({ name: `xl/worksheets/sheet${idx + 1}.xml`, data: Buffer.from(sheetXml) });
  });
  return new Uint8Array(zipFiles(files));
}

export function workbookFromOutput(capabilityId: string, output: Record<string, unknown>, petName: string): WorkbookSheet[] {
  const cap = capabilityId.includes("exams") || capabilityId === "eccolab" ? "exams" : capabilityId;
  if (cap === "exams") {
    const markers = Array.isArray(output.markers) ? output.markers : [];
    return [
      {
        name: "Marcadores",
        headers: ["Data", "Exame", "Marcador", "Resultado", "Unidade", "Referência", "Status", "Fonte"],
        rows: markers.map((m) => {
          const row = m as Record<string, unknown>;
          return [
            String(output.examDate ?? ""),
            String(output.examName ?? ""),
            String(row.name ?? ""),
            String(row.value ?? ""),
            String(row.unit ?? ""),
            String(row.reference ?? ""),
            String(row.status ?? ""),
            String(output.laboratory ?? ""),
          ];
        }),
      },
    ];
  }
  if (capabilityId.includes("nutri")) {
    return [
      {
        name: "Rotina",
        headers: ["Dia", "Horário", "Alimento", "Quantidade", "Observação", "Consumo"],
        rows: [["Segunda", "Manhã", "Ração atual", "", "Orientativo", ""]],
      },
    ];
  }
  if (capabilityId.includes("peso")) {
    return [{ name: "Peso", headers: ["Data", "Peso", "Variação", "Meta", "Alimentação", "Atividade", "Observações"], rows: [] }];
  }
  if (capabilityId.includes("behavior")) {
    return [
      {
        name: "Plano",
        headers: ["Dia", "Exercício", "Duração", "Gatilho", "Resposta", "Resultado", "Observação"],
        rows: [],
      },
    ];
  }
  if (capabilityId.includes("vacina")) {
    return [{ name: "Carteira", headers: ["Vacina", "Data", "Próxima", "Status"], rows: [] }];
  }
  if (capabilityId.includes("med")) {
    return [
      {
        name: "Medicamentos",
        headers: ["Medicamento", "Dose informada", "Horário", "Data", "Administrado", "Observação"],
        rows: [],
      },
    ];
  }
  if (capabilityId.includes("checkup")) {
    return [
      {
        name: "Áreas",
        headers: ["Área", "Resposta atual", "Status", "Meta", "Próxima revisão", "Observações"],
        rows: [
          ["Rotina", String(output.routine ?? ""), "", "", "", ""],
          ["Alimentação", String(output.feeding ?? ""), "", "", "", ""],
        ],
      },
    ];
  }
  return [
    {
      name: "Acompanhamento",
      headers: ["Item", "O que observar", "Frequência", "Status", "Data", "Observação", "Pet"],
      rows: (Array.isArray(output.watchFor) ? output.watchFor : []).map((item) => [
        String(item),
        String(item),
        "Diário",
        "Aberto",
        "",
        "",
        petName,
      ]),
    },
  ];
}
