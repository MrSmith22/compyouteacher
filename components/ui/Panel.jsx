import Card from "@/components/ui/Card";

export default function Panel({ children, className = "" }) {
  return (
    <Card className={className}>
      {children}
    </Card>
  );
}