const S = {
  fontSize: '10px',
  color: 'var(--text3)',
  marginTop: '10px',
  textAlign: 'right',
  opacity: 0.65,
  letterSpacing: '0.02em',
};

export default function SourceTag({ label }) {
  return <div style={S}>Source : {label}</div>;
}
