type Props = {
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function AdminHeader({ title, description, children }: Props) {
  return (
    <header className="border-b border-border bg-header px-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {children}
      </div>
    </header>
  );
}
