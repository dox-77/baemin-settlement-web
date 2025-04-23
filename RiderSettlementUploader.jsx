
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
        원천징수,
        지급금액: Math.round(지급금액),
      });
    });

    return result;
  };

  return (
    <div className="p-4 space-y-4">
      <div {...getRootProps()} style={{ border: "2px dashed gray", padding: "20px", borderRadius: "10px", textAlign: "center" }}>
        <input {...getInputProps()} />
        <p>배달처리비 엑셀 파일을 업로드해주세요</p>
      </div>

      {data.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
            <thead>
              <tr>
                {Object.keys(data[0]).map((key) => (
                  <th key={key} style={{ border: "1px solid #ddd", padding: "8px", background: "#f0f0f0" }}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val, j) => (
                    <td key={j} style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
