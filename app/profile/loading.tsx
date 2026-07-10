import { SkeletonProfile, SkeletonList } from '../components/Skeleton'

export default function Loading() {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <SkeletonProfile />
      <SkeletonList count={4} />
    </div>
  )
}
