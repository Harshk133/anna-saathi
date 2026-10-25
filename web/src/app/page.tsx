import { Stage } from "@/components/Stage";
import { StoreProvider } from "@/lib/store";

export default function Page() {
  return (
    <StoreProvider>
      <Stage />
    </StoreProvider>
  );
}
