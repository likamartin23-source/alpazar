import { SkeletonList } from '../components/Skeleton'

export default function Loading() {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', paddingTop: 8 }}>
      <SkeletonList count={5} />
    </div>
  )
}
