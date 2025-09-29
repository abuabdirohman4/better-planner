import Button from '@/components/ui/button/Button';

interface ActionButtonsProps {
  onReset: () => void;
  onCommit: () => void;
}

export default function ActionButtons({ onReset, onCommit }: ActionButtonsProps) {
  return (
    <div className="mt-2 mx-10 flex gap-2">
      <Button
        type="button"
        size="md"
        variant="outline"
        onClick={onReset}
        className="w-full"
      >
        Reset
      </Button>
      <Button
        type="button"
        size="md"
        variant="primary"
        className="w-full"
        onClick={onCommit}
      >
        Submit
      </Button>
    </div>
  );
}
