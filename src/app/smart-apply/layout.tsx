export default function SmartApplyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-full">
            {children}
        </div>
    );
}
