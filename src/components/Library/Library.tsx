import type { VideoMeta } from '../../types';
import { VideoCard } from './VideoCard';
import styles from './Library.module.css';

interface Props {
  videos: VideoMeta[];
}

export function Library({ videos }: Props) {
  const count = videos.length;
  return (
    <section id="library" className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Your Recordings</h2>
        {count > 0 && (
          <span className={styles.count}>
            {count} video{count === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {count === 0 ? (
        <p className={styles.empty}>No recordings yet. Record something to see it here.</p>
      ) : (
        <div className={styles.grid}>
          {videos.map((v) => (
            <VideoCard key={v.url} video={v} />
          ))}
        </div>
      )}
    </section>
  );
}
