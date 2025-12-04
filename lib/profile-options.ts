export type ProfileTag = {
  value: string;
  label: string;
  category: string;
};

const technology = [
  ["javascript", "JavaScript"],
  ["python", "Python"],
  ["java", "Java"],
  ["c++", "C++"],
  ["typescript", "TypeScript"],
  ["react", "React"],
  ["node.js", "Node.js"],
  ["express", "Express"],
  ["next.js", "Next.js"],
  ["graphql", "GraphQL"],
  ["mobile development", "Mobile Development"],
  ["devops", "DevOps"],
  ["cloud", "Cloud Platforms"],
  ["aws", "AWS"],
  ["azure", "Azure"],
  ["gcp", "Google Cloud"],
  ["data science", "Data Science"],
  ["machine learning", "Machine Learning"],
  ["ai", "Artificial Intelligence"],
  ["cybersecurity", "Cybersecurity"],
  ["blockchain", "Blockchain & Web3"],
  ["game development", "Game Development"],
  ["ui/ux", "UI / UX Design"],
];

const creative = [
  ["product design", "Product Design"],
  ["graphic design", "Graphic Design"],
  ["illustration", "Illustration"],
  ["photography", "Photography"],
  ["video production", "Video Production"],
  ["music production", "Music Production"],
  ["podcasting", "Podcasting"],
  ["creative writing", "Creative Writing"],
  ["storytelling", "Storytelling"],
  ["acting", "Acting & Theatre"],
  ["dance", "Dance"],
  ["fashion", "Fashion Design"],
  ["content creation", "Content Creation"],
  ["social media", "Social Media Strategy"],
  ["marketing", "Marketing Strategy"],
  ["branding", "Branding"],
  ["copywriting", "Copywriting"],
];

const business = [
  ["entrepreneurship", "Entrepreneurship"],
  ["startups", "Startups"],
  ["product management", "Product Management"],
  ["project management", "Project Management"],
  ["operations", "Operations"],
  ["sales", "Sales"],
  ["customer success", "Customer Success"],
  ["people management", "People Management"],
  ["leadership", "Leadership"],
  ["finance", "Finance"],
  ["investing", "Investing"],
  ["accounting", "Accounting"],
  ["economics", "Economics"],
  ["legal", "Legal & Compliance"],
  ["hr", "HR & Talent"],
];

const wellness = [
  ["coaching", "Coaching"],
  ["mentoring", "Mentoring"],
  ["education", "Education & Teaching"],
  ["public speaking", "Public Speaking"],
  ["career growth", "Career Growth"],
  ["mental health", "Mental Health"],
  ["wellness", "Wellness"],
  ["fitness", "Fitness"],
  ["yoga", "Yoga"],
  ["meditation", "Meditation"],
  ["nutrition", "Nutrition"],
  ["lifestyle design", "Lifestyle Design"],
  ["habit building", "Habit Building"],
  ["productivity", "Productivity"],
];

const lifestyle = [
  ["travel", "Travel"],
  ["languages", "Languages & Localization"],
  ["community building", "Community Building"],
  ["volunteering", "Volunteering"],
  ["sustainability", "Sustainability"],
  ["environment", "Climate & Environment"],
  ["gardening", "Gardening"],
  ["culinary arts", "Cooking & Culinary Arts"],
  ["baking", "Baking"],
  ["parenting", "Parenting"],
  ["pet care", "Pet Care"],
  ["gaming", "Gaming & Esports"],
  ["outdoor adventures", "Outdoor Adventures"],
  ["sports", "Sports & Athletics"],
  ["creative hobbies", "Creative Hobbies"],
];

const academics = [
  ["research", "Research"],
  ["biology", "Biology"],
  ["chemistry", "Chemistry"],
  ["physics", "Physics"],
  ["mathematics", "Mathematics"],
  ["astronomy", "Astronomy"],
  ["psychology", "Psychology"],
  ["philosophy", "Philosophy"],
  ["history", "History"],
  ["politics", "Politics & Policy"],
  ["international relations", "International Relations"],
  ["architecture", "Architecture"],
  ["interior design", "Interior Design"],
  ["urban planning", "Urban Planning"],
  ["medicine", "Medicine"],
  ["nursing", "Nursing"],
  ["public health", "Public Health"],
];

type TagTuple = [string, string, string];

function buildTags(category: string, tuples: [string, string][]): TagTuple[] {
  return tuples.map(([value, label]) => [value, label, category]);
}

const rawTags: TagTuple[] = [
  ...buildTags("Technology", technology),
  ...buildTags("Creative", creative),
  ...buildTags("Business", business),
  ...buildTags("Wellness & Growth", wellness),
  ...buildTags("Lifestyle", lifestyle),
  ...buildTags("Academics", academics),
];

export const PROFILE_TAGS: ProfileTag[] = rawTags.map(([value, label, category]) => ({
  value,
  label,
  category,
}));

export const PROFILE_TAG_MAP = PROFILE_TAGS.reduce<Record<string, ProfileTag>>((acc, tag) => {
  acc[tag.value] = tag;
  return acc;
}, {});

export const PROFILE_TAG_VALUES = PROFILE_TAGS.map((tag) => tag.value);


