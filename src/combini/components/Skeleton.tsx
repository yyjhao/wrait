import styles from "./Skeleton.module.css"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`${styles.skeleton} ${className ?? ""}`}
      {...props}
    />
  )
}
 
export { Skeleton }