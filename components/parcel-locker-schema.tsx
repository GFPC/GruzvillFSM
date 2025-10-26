import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Cell {
  id: string;
  size: "S" | "M" | "L";
  status: "free" | "occupied" | "reserved" | "repair";
  orderId?: number;
}

interface ParcelLockerSchemaProps {
  lockerId: string;
  cells: Cell[];
}

export default function ParcelLockerSchema({ lockerId, cells }: ParcelLockerSchemaProps) {
  const getStatusColor = (status: Cell["status"]) => {
    switch (status) {
      case "free": return "bg-green-100 text-green-800";
      case "occupied": return "bg-blue-100 text-blue-800";
      case "reserved": return "bg-yellow-100 text-yellow-800";
      case "repair": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: Cell["status"]) => {
    switch (status) {
      case "free": return "Свободно";
      case "occupied": return "Занято";
      case "reserved": return "Зарезервировано";
      case "repair": return "В ремонте";
      default: return status;
    }
  };

  return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Постамат #{lockerId}</h3>
          <Badge variant="outline">
            {(cells || []).filter(c => c.status === "free").length} / {(cells || []).length} свободно
          </Badge>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Ячейка</TableHead>
                <TableHead className="w-20">Размер</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-32">Заказ</TableHead>
                <TableHead className="w-32 text-right">Действие</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(cells || []).map((cell) => (
                  <TableRow key={cell.id}> {/* ВОТ КЛЮЧ! */}
                    <TableCell className="font-medium">{cell.id}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {cell.size}
                      </Badge>
                    </TableCell>
                    <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cell.status)}`}>
                    {getStatusLabel(cell.status)}
                  </span>
                    </TableCell>
                    <TableCell>
                      {cell.orderId ? (
                          <Badge variant="default">#{cell.orderId}</Badge>
                      ) : (
                          <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {cell.status === "free" ? (
                          <Button size="sm" variant="outline">Занять</Button>
                      ) : cell.status === "occupied" ? (
                          <Button size="sm">Открыть</Button>
                      ) : cell.status === "repair" ? (
                          <Button size="sm" variant="destructive">Ремонт</Button>
                      ) : (
                          <Button size="sm" disabled>Ожидание</Button>
                      )}
                    </TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
  );
}