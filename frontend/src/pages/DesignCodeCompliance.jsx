import React, { useEffect, useState } from 'react';

export default function DesignCodeCompliance() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/design-code-compliance').then(r => r.json()).then(setData).catch(() => {}); }, []);
  return (
    <div>
      <h1>Design Code Compliance Checker</h1>
      <p>Reviews interior layouts for egress, aisle clearance, and outlet spacing issues.</p>
      {data?.rooms?.map((r) => <section key={r.room} className="card"><h2>{r.room}</h2><p>{r.status}</p><ul>{r.issues.map((i) => <li key={i}>{i}</li>)}</ul></section>)}
    </div>
  );
}
