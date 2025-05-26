interface SkillBadgeProps {
  level: string;
  size?: "sm" | "md";
}

export default function SkillBadge({ level, size = "md" }: SkillBadgeProps) {
  const getSkillClass = (skillLevel: string) => {
    switch (skillLevel.toLowerCase()) {
      case "beginner":
        return "skill-badge-beginner";
      case "recreational":
        return "skill-badge-recreational";
      case "collegiate":
        return "skill-badge-collegiate";
      case "professional":
        return "skill-badge-professional";
      default:
        return "skill-badge-recreational";
    }
  };

  const sizeClass = size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1 text-xs";

  return (
    <span className={`${getSkillClass(level)} ${sizeClass} rounded-full text-white font-semibold capitalize`}>
      {level}
    </span>
  );
}
