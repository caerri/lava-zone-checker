export default function Home() {
  return (
    <div 
      className="w-screen h-screen home-bg" 
      style={{ '--bg-image': 'url("/the-office-yeah.gif")' } as React.CSSProperties & { '--bg-image': string }}
    />
  );
}
