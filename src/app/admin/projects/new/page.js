import ProjectForm from "../ProjectForm";

export default function NewProjectPage() {
  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 24 }}>新建项目</h1>
      <ProjectForm initial={null} />
    </div>
  );
}
