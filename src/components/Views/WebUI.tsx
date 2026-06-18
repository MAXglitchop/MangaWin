interface WebUIProps {
  port: string;
}

export function WebUI({ port }: WebUIProps) {
  return (
    <div className="engine-iframe-wrapper bg-transparent">
      <iframe 
        src={`http://localhost:${port}`}
        className="w-full h-full border-none m-0 p-0"
        style={{ border: 'none', outline: 'none' }}
        title="Suwayomi WebUI"
      />
    </div>
  );
}
