import { SkeletonGrid } from '../components/Skeleton'

export default function Loading() {
  return (
    <div style={{ paddingTop: 16 }}>
      <SkeletonGrid count={6} />
    </div>
  )
}
