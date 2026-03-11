import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

const SKELETON_KEYS = ["sk-a", "sk-b", "sk-c", "sk-d", "sk-e", "sk-f"];
const CELL_KEYS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"];

interface SkeletonRowsProps {
  rows?: number;
  cols?: number;
}

export function SkeletonTableRows({ rows = 4, cols = 4 }: SkeletonRowsProps) {
  return (
    <>
      {SKELETON_KEYS.slice(0, rows).map((rk) => (
        <TableRow key={rk}>
          {CELL_KEYS.slice(0, cols).map((ck) => (
            <TableCell key={ck}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
