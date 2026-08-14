type LeftArrowProps = {
  className?: string;
};

export default function LeftArrow(props: LeftArrowProps) {
  const { className } = props;

  return (
    <svg viewBox='0 0 15 15' fill='currentColor' xmlns='http://www.w3.org/2000/svg' className={className}>
      <path
        d='M8.8416 3.13508C8.64015 2.94621 8.32373 2.95642 8.13486 3.15788L4.38486 7.15788C4.20455 7.3502 4.20455 7.64949 4.38486 7.84182L8.13486 11.8418C8.32373 12.0433 8.64015 12.0535 8.8416 11.8646C9.04306 11.6757 9.05327 11.3593 8.8644 11.1579L5.435 7.49985L8.8644 3.84182C9.05327 3.64036 9.04306 3.32394 8.8416 3.13508Z'
        fillRule='evenodd'
        clipRule='evenodd'
      />
    </svg>
  );
}
