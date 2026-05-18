export default function JobsLayout({
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
