
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";

export default function RiderSettlementUploader() {
  const [data, setData] = useState([]);

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const ab = e.target.result;
      const wb = XLSX.read(ab, { type: "binary" });
      const sheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet);
      const processed = calculateSettlement(json);
      setData(processed);
    };

    reader.readAsBinaryString(file);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const numberWithCommas = (x) => {
    return x.toLocaleString();
  };

  const calculateSettlement = (rows) => {
    const result = [];
    const grouped = {};

    rows.forEach((row) => {
      const uid = row["User ID"];
      const name = row["라이더명"];
      const fee = parseFloat(row["배달처리비"] || 0);
      if (!grouped[uid]) {
        grouped[uid] = { uid, name, total: 0, count: 0 };
      }
      grouped[uid].total += fee;
      grouped[uid].count += 1;
    });

    Object.values(grouped).forEach(({ uid, name, total, count }, i) => {
      const 필요경비 = total * 0.191;
      const 보수액 = total - 필요경비;
      const 고용보험_라이더 = 보수액 * 0.007;
      const 산재보험_라이더 = 보수액 * 0.009;
      const 운영비 = count * 100;
      const 정산금액 = total - 고용보험_라이더 - 산재보험_라이더 - 운영비;
      const 소득세 = total * 0.03;
      const 주민세 = 소득세 * 0.1;
      const 원천징수 = 소득세 + 주민세;
      const 지급금액 = 정산금액 - 원천징수;

      result.push({
        NO: i + 1,
        uid,
        name,
        처리건수: count,
        총배달료: Math.round(total),
        필요경비: Math.round(필요경비),
        고용보험_라이더: Math.round(고용보험_라이더),
        산재보험_라이더: Math.round(산재보험_라이더),
        운영비,
        정산금액: Math.round(정산금액),
        소득세: Math.round(소득세),
        주민세: Math.round(주민세),
        원천징수: Math.round(원천징수),
        지급금액: Math.round(지급금액),
      });
    });

    return result;
  };

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "정산결과");
    XLSX.writeFile(wb, "배민커넥트_정산결과.xlsx");
  };

  return (
    <div>
      <img src="/logo.png" alt="logo" style={{ height: 60, marginBottom: 20 }} />
      <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: 20 }}>
        배달처리비 엑셀 파일을 업로드해주세요
      </h2>

      <div {...getRootProps()} style={{
        border: "2px dashed #60a5fa",
        padding: "20px",
        borderRadius: "10px",
        background: "#f0f9ff",
        marginBottom: "20px"
      }}>
        <input {...getInputProps()} />
        <p style={{ textAlign: "center", color: "#3b82f6" }}>
          여기에 파일을 드래그하거나 클릭하여 업로드
        </p>
      </div>

      {data.length > 0 && (
        <>
          <button onClick={downloadExcel} style={{
            background: "#2563eb",
            color: "white",
            padding: "10px 20px",
            borderRadius: "8px",
            marginBottom: "16px",
            border: "none"
          }}>
            엑셀 다운로드
          </button>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%" }}>
              <thead>
                <tr>
                  {Object.keys(data[0]).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} style={{ textAlign: "right" }}>
                        {typeof val === "number" ? numberWithCommas(val) : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
