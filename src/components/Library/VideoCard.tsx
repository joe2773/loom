import type { VideoMeta } from '../../types';
import styles from './Library.module.css';

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Props {
  video: VideoMeta;
}

export function VideoCard({ video }: Props) {
  return (
    <article
      className={styles.card}
      title={video.name}
      onClick={() => window.open(video.url, '_blank')}
    >
      <div className={styles.thumb}>
        <video src={video.url} preload="metadata" muted />
      </div>
      <div className={styles.meta}>
        <span className={styles.name}>{video.name}</span>
        <span className={styles.date}>{video.created ? formatDate(video.created) : ''}</span>
      </div>
    </article>
  );
}
