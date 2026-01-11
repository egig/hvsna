export default function PageHeader({title, subtitle}: {title: string, subtitle?: string}) {
    return <div>
        <h1 className="text-xl font-bold">{title}</h1>
        {subtitle && <h2 className="text-sm">{subtitle}</h2>}
    </div>
}