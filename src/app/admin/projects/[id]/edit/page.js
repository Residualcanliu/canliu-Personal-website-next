"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProjectForm from "../../ProjectForm";

export default function EditProjectPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/admin/projects/${id}`)
      .then(res => {
        if (res.status === 401) { router.push("/admin/login"); return null; }
        if (!res.ok) throw new Error("项目不存在");
        return res.json();
      })
      .then(data => { if (data) setProject(data); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p style={{ color: "#9ca3af" }}>加载中...</p>;
  if (error) return <p style={{ color: "#fca5a5" }}>{error}</p>;

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 24 }}>编辑项目</h1>
      <ProjectForm initial={project} />
    </div>
  );
}
