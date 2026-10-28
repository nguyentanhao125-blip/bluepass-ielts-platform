import {
  AnnouncementItem,
  ChatThreadItem,
  TestAttemptItem,
  TestItem,
  UserProfile,
  VocabDeckItem,
} from "./types";

export const INITIAL_USERS: UserProfile[] = [
  {
    id: "user-student-1",
    email: "hocvien@bluepass.edu.vn",
    fullName: "Nguyễn Minh Khôi",
    studentCode: "HV-2026-1042",
    phone: "0912345678",
    targetBand: 7.5,
    currentLevel: "B2 - Upper Intermediate",
    role: "STUDENT",
    createdAt: "2026-09-15T08:00:00.000Z",
  },
  {
    id: "user-staff-1",
    email: "tuvan@bluepass.edu.vn",
    fullName: "Trần Thanh Thảo (Tư vấn viên)",
    studentCode: "NV-2026-008",
    phone: "0987654321",
    targetBand: 8.5,
    currentLevel: "C2 - Academic Staff",
    role: "STAFF",
    createdAt: "2026-01-10T08:00:00.000Z",
  },
  {
    id: "user-admin-1",
    email: "admin@bluepass.edu.vn",
    fullName: "TS. Lê Hoàng Nam (Trưởng Ban Khảo Thí)",
    studentCode: "AD-2026-001",
    phone: "0909888999",
    targetBand: 9.0,
    currentLevel: "C2 - Principal Examiner",
    role: "ADMIN",
    createdAt: "2026-01-01T08:00:00.000Z",
  },
];

export const INITIAL_TESTS: TestItem[] = [
  // =========================================================================
  // 1. READING PASSAGE 1: How popcorn came to the cinema (Matches Screenshot 1 Card 1)
  // =========================================================================
  {
    id: "test-popcorn-cinema",
    slug: "how-popcorn-came-to-the-cinema",
    title: "[BluePass Collect] - How popcorn came to the cinema",
    description:
      "Bài đọc Passage 1 chuẩn đề thi thật IELTS về lịch sử thú vị đưa bắp rang bơ vào các rạp chiếu phim trong thời kỳ Đại Suy Thoái.",
    skill: "READING",
    mode: "SINGLE_PASSAGE",
    passageNumber: 1,
    source: "COLLECT_REAL",
    durationMinutes: 20,
    totalQuestions: 10,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&w=800&q=80",
    attemptCount: 7520,
    questionTypesSummary: ["Gap Filling", "True - False - Not Given"],
    isPlacement: false,
    isPublished: true,
    createdAt: "2026-10-01T09:00:00.000Z",
    parts: [
      {
        id: "part-popcorn-1",
        testId: "test-popcorn-cinema",
        partNumber: 1,
        title: "READING PASSAGE 1",
        subtitle:
          "You should spend about 20 minutes on Questions 1–10, which are based on Reading Passage 1 below.",
        passageHtml: `
          <div class="space-y-4 leading-relaxed text-slate-800">
            <h2 class="text-xl font-bold text-slate-900">How Popcorn Came to the Cinema</h2>
            <p class="italic text-slate-600">The aromatic snack was once banned from American movie theatres before becoming their greatest financial saviour.</p>
            <p><strong>A.</strong> Today, the scent of buttered popcorn is almost synonymous with the cinema experience. Yet in the early 1920s, when grand "movie palaces" were built across North America to screen silent films, theatre owners fiercely resisted allowing popcorn inside. These ornate venues featured crystal chandeliers, plush velvet seats, and expensive <strong>carpets</strong> imported from Europe. Owners wanted to emulate high-class legitimate opera houses and feared that noisy eating and spilled kernels would ruin both the aristocratic atmosphere and the costly floor coverings.</p>
            <p><strong>B.</strong> Moreover, silent films required audiences to read intertitle cards projected on the screen. Consequently, early cinema attendance was restricted primarily to <strong>literate</strong> and relatively affluent patrons who could afford pricey tickets. Street vendors, however, quickly realised that thousands of people exiting theatres represented a lucrative market. Operating mobile steam-powered or gas-powered wagons on the <strong>sidewalk</strong> just outside theatre entrances, entrepreneurs sold paper bags of warm popcorn for five cents apiece.</p>
            <p><strong>C.</strong> Two historical turning points transformed this relationship forever. First, the introduction of synchronized sound ("talkies") in 1927 eliminated the need to read subtitles, opening the cinema to working-class families and children of all backgrounds. Second, the onset of the <strong>depression</strong> in 1929 devastated luxury entertainment businesses. As ticket sales plummeted, independent vendors selling cheap snacks outside the doors were thriving while theatre proprietors inside were facing bankruptcy.</p>
            <p><strong>D.</strong> One enterprising businessman in Kansas City, Charles Cretors' client named Julia Braden, persuaded the Linwood Theater to let her set up a popcorn stand right inside the <strong>lobby</strong> in 1931. Within a few years, she operated a chain of concessions generating over $14,000 annually. In Dallas, theatre chain manager R. J. McKenna noticed that lobbies with popcorn machines earned far higher profits than tickets alone. He subsequently lowered admission prices to attract larger crowds, knowing they would purchase high-margin snacks.</p>
            <p><strong>E.</strong> World War II cemented popcorn's dominance in cinemas. When sugar rations were strictly imposed in 1942, traditional sweets, chocolates, and soft drinks became scarce. Popcorn, which required only corn kernels, oil, and <strong>salt</strong>, remained abundant and inexpensive, resulting in a tripling of national consumption by 1945.</p>
          </div>
        `,
        questionGroups: [
          {
            id: "qg-popcorn-1",
            partId: "part-popcorn-1",
            orderIndex: 1,
            questionType: "GAP_FILL",
            title: "Questions 1 – 5: Gap Filling (Notes Completion)",
            instructions:
              "Complete the notes below. Choose ONE WORD ONLY from the passage for each answer.",
            wordLimitNote: "ONE WORD ONLY",
            questions: [
              {
                id: "q-popcorn-1",
                groupId: "qg-popcorn-1",
                questionNumber: 1,
                prompt:
                  "In the 1920s, cinema owners worried that popcorn would damage their luxurious ________.",
                correctAnswer: "carpets|carpet",
                explanation:
                  "Đoạn A: '...featured crystal chandeliers, plush velvet seats, and expensive carpets imported from Europe... feared that noisy eating and spilled kernels would ruin... costly floor coverings.'",
                points: 1,
              },
              {
                id: "q-popcorn-2",
                groupId: "qg-popcorn-1",
                questionNumber: 2,
                prompt:
                  "Early silent movies mainly attracted ________ spectators because viewers had to read text on screen.",
                correctAnswer: "literate",
                explanation:
                  "Đoạn B: 'Consequently, early cinema attendance was restricted primarily to literate and relatively affluent patrons...'",
                points: 1,
              },
              {
                id: "q-popcorn-3",
                groupId: "qg-popcorn-1",
                questionNumber: 3,
                prompt:
                  "Street sellers initially positioned their carts on the ________ outside the theatre doors.",
                correctAnswer: "sidewalk|sidewalks",
                explanation:
                  "Đoạn B: 'Operating mobile steam-powered or gas-powered wagons on the sidewalk just outside theatre entrances...'",
                points: 1,
              },
              {
                id: "q-popcorn-4",
                groupId: "qg-popcorn-1",
                questionNumber: 4,
                prompt:
                  "The economic ________ that began in 1929 forced theatre owners to reconsider selling cheap snacks.",
                correctAnswer: "depression|great depression",
                explanation:
                  "Đoạn C: 'Second, the onset of the depression in 1929 devastated luxury entertainment businesses.'",
                points: 1,
              },
              {
                id: "q-popcorn-5",
                groupId: "qg-popcorn-1",
                questionNumber: 5,
                prompt:
                  "In 1931, Julia Braden was permitted to install a popcorn stall inside the theatre ________.",
                correctAnswer: "lobby",
                explanation:
                  "Đoạn D: '...persuaded the Linwood Theater to let her set up a popcorn stand right inside the lobby in 1931.'",
                points: 1,
              },
            ],
          },
          {
            id: "qg-popcorn-2",
            partId: "part-popcorn-1",
            orderIndex: 2,
            questionType: "TFNG",
            title: "Questions 6 – 10: True / False / Not Given",
            instructions:
              "Do the following statements agree with the information given in Reading Passage 1? Choose TRUE, FALSE, or NOT GIVEN.",
            questions: [
              {
                id: "q-popcorn-6",
                groupId: "qg-popcorn-2",
                questionNumber: 6,
                prompt:
                  "Early 1920s movie theatres were designed to resemble prestigious opera houses.",
                options: [
                  { label: "TRUE", value: "TRUE", text: "TRUE" },
                  { label: "FALSE", value: "FALSE", text: "FALSE" },
                  { label: "NOT GIVEN", value: "NOT GIVEN", text: "NOT GIVEN" },
                ],
                correctAnswer: "TRUE",
                explanation:
                  "Đoạn A nêu rõ: 'Owners wanted to emulate high-class legitimate opera houses'.",
                points: 1,
              },
              {
                id: "q-popcorn-7",
                groupId: "qg-popcorn-2",
                questionNumber: 7,
                prompt:
                  "The introduction of sound films in 1927 caused cinema attendance among children to decline.",
                options: [
                  { label: "TRUE", value: "TRUE", text: "TRUE" },
                  { label: "FALSE", value: "FALSE", text: "FALSE" },
                  { label: "NOT GIVEN", value: "NOT GIVEN", text: "NOT GIVEN" },
                ],
                correctAnswer: "FALSE",
                explanation:
                  "Đoạn C: '...opening the cinema to working-class families and children of all backgrounds' (tăng lên chứ không phải giảm).",
                points: 1,
              },
              {
                id: "q-popcorn-8",
                groupId: "qg-popcorn-2",
                questionNumber: 8,
                prompt:
                  "Julia Braden paid the Linwood Theater 20% of her monthly popcorn revenue.",
                options: [
                  { label: "TRUE", value: "TRUE", text: "TRUE" },
                  { label: "FALSE", value: "FALSE", text: "FALSE" },
                  { label: "NOT GIVEN", value: "NOT GIVEN", text: "NOT GIVEN" },
                ],
                correctAnswer: "NOT GIVEN",
                explanation:
                  "Đoạn D chỉ nhắc doanh thu $14,000 mỗi năm của Julia Braden, không hề đề cập tỷ lệ phần trăm chia sẻ doanh thu 20%.",
                points: 1,
              },
              {
                id: "q-popcorn-9",
                groupId: "qg-popcorn-2",
                questionNumber: 9,
                prompt:
                  "R. J. McKenna increased movie ticket prices after installing popcorn machines in his theatres.",
                options: [
                  { label: "TRUE", value: "TRUE", text: "TRUE" },
                  { label: "FALSE", value: "FALSE", text: "FALSE" },
                  { label: "NOT GIVEN", value: "NOT GIVEN", text: "NOT GIVEN" },
                ],
                correctAnswer: "FALSE",
                explanation:
                  "Đoạn D: 'He subsequently lowered admission prices to attract larger crowds' (ông giảm giá vé chứ không tăng).",
                points: 1,
              },
              {
                id: "q-popcorn-10",
                groupId: "qg-popcorn-2",
                questionNumber: 10,
                prompt:
                  "Sugar rationing during World War II helped boost the popularity of popcorn over candy.",
                options: [
                  { label: "TRUE", value: "TRUE", text: "TRUE" },
                  { label: "FALSE", value: "FALSE", text: "FALSE" },
                  { label: "NOT GIVEN", value: "NOT GIVEN", text: "NOT GIVEN" },
                ],
                correctAnswer: "TRUE",
                explanation:
                  "Đoạn E: 'When sugar rations were strictly imposed in 1942, traditional sweets, chocolates... became scarce. Popcorn... resulted in a tripling of national consumption'.",
                points: 1,
              },
            ],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 2. READING PASSAGE 2: The rise of short-sightedness (Matches Screenshot 1 Card 2)
  // =========================================================================
  {
    id: "test-short-sightedness",
    slug: "the-rise-of-short-sightedness",
    title: "[BluePass Collect] - The rise of short-sightedness",
    description:
      "Bài đọc Passage 2 phân tích nguyên nhân bùng nổ tật cận thị (Myopia) toàn cầu và vai trò của ánh sáng tự nhiên ngoài trời.",
    skill: "READING",
    mode: "SINGLE_PASSAGE",
    passageNumber: 2,
    source: "COLLECT_REAL",
    durationMinutes: 20,
    totalQuestions: 10,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80",
    attemptCount: 2660,
    questionTypesSummary: [
      "Gap Filling",
      "Matching Features",
      "Matching Information",
    ],
    isPlacement: false,
    isPublished: true,
    createdAt: "2026-10-02T09:00:00.000Z",
    parts: [
      {
        id: "part-myopia-1",
        testId: "test-short-sightedness",
        partNumber: 1,
        title: "READING PASSAGE 2",
        subtitle:
          "You should spend about 20 minutes on Questions 1–10, which are based on Reading Passage 2 below.",
        passageHtml: `
          <div class="space-y-4 leading-relaxed text-slate-800">
            <h2 class="text-xl font-bold text-slate-900">The Rise of Short-Sightedness</h2>
            <p><strong>Paragraph A.</strong> Over the past half-century, the prevalence of myopia—commonly known as short-sightedness—has surged at an alarming rate. In several East Asian metropolises, between 80% and 90% of high-school graduates now require corrective lenses. For decades, ophthalmologists assumed this epidemic was primarily driven by genetics combined with excessive "near-work" such as reading books or staring at computer monitors.</p>
            <p><strong>Paragraph B.</strong> However, landmark epidemiological work led by <strong>Professor Ian Morgan</strong> at the Australian National University challenged the purely genetic view. Morgan pointed out that gene pools cannot mutate across an entire population in just two generations. Instead, his team compared children of Chinese heritage growing up in Sydney with those in Singapore. Despite sharing similar genetic backgrounds and reading habits, only 3% of the Sydney group developed myopia, compared to 29% in Singapore—a gap traced directly to the 14 hours per week Sydney children spent outdoors.</p>
            <p><strong>Paragraph C.</strong> Why does outdoor time protect the developing eye? <strong>Dr. Donald Mutti</strong> and colleagues in Ohio proposed that bright natural daylight stimulates the release of a neurotransmitter called <strong>dopamine</strong> within the retina. In healthy eyes, this chemical prevents the eyeball from elongating excessively from front to back during childhood growth. Indoor lighting, even in well-lit classrooms, is typically hundreds of times dimmer than outdoor shade.</p>
            <p><strong>Paragraph D.</strong> Meanwhile, <strong>Professor Kathryn Rose</strong> emphasized that the protective effect of being outside does not require vigorous physical sport; simply sitting under a tree or walking in open daylight provides sufficient luminous intensity. In clinical trials conducted in Taiwan by <strong>Dr. Pei-Chang Wu</strong>, primary schools that locked classroom doors during <strong>recess</strong>—forcing pupils into the courtyard for 80 minutes daily—reduced new cases of short-sightedness by half within one academic year.</p>
            <p><strong>Paragraph E.</strong> Alongside lifestyle interventions, optical engineers have developed specialized <strong>contact</strong> lenses and atropine eye drops that slow the progression of eyeball elongation in children already diagnosed with mild myopia, reducing the risk of severe retinal detachment later in adulthood.</p>
          </div>
        `,
        questionGroups: [
          {
            id: "qg-myopia-1",
            partId: "part-myopia-1",
            orderIndex: 1,
            questionType: "MATCHING_INFO",
            title: "Questions 1 – 4: Matching Information",
            instructions:
              "Reading Passage 2 has five paragraphs, A–E. Which paragraph contains the following information?",
            sharedOptions: {
              title: "Paragraphs A – E",
              items: [
                { key: "A", text: "Paragraph A" },
                { key: "B", text: "Paragraph B" },
                { key: "C", text: "Paragraph C" },
                { key: "D", text: "Paragraph D" },
                { key: "E", text: "Paragraph E" },
              ],
            },
            questions: [
              {
                id: "q-myopia-1",
                groupId: "qg-myopia-1",
                questionNumber: 1,
                prompt:
                  "A comparison between two groups of children sharing the same ethnic origin but living in different cities.",
                correctAnswer: "B",
                explanation:
                  "Đoạn B so sánh trẻ em gốc Hoa sống tại Sydney (3% cận thị) và Singapore (29% cận thị).",
                points: 1,
              },
              {
                id: "q-myopia-2",
                groupId: "qg-myopia-1",
                questionNumber: 2,
                prompt:
                  "A contrast between the brightness of indoor rooms and natural outdoor environments.",
                correctAnswer: "C",
                explanation:
                  "Đoạn C: 'Indoor lighting, even in well-lit classrooms, is typically hundreds of times dimmer than outdoor shade.'",
                points: 1,
              },
              {
                id: "q-myopia-3",
                groupId: "qg-myopia-1",
                questionNumber: 3,
                prompt:
                  "Statistical figures showing the extremely high rate of short-sightedness among school leavers in East Asia.",
                correctAnswer: "A",
                explanation:
                  "Đoạn A: 'In several East Asian metropolises, between 80% and 90% of high-school graduates now require corrective lenses.'",
                points: 1,
              },
              {
                id: "q-myopia-4",
                groupId: "qg-myopia-1",
                questionNumber: 4,
                prompt:
                  "Mention of medical treatments designed for children who have already developed short-sightedness.",
                correctAnswer: "E",
                explanation:
                  "Đoạn E đề cập kính áp tròng chuyên dụng và thuốc nhỏ mắt atropine làm chậm tiến triển cận thị.",
                points: 1,
              },
            ],
          },
          {
            id: "qg-myopia-2",
            partId: "part-myopia-1",
            orderIndex: 2,
            questionType: "MATCHING_FEATURES",
            title: "Questions 5 – 7: Matching Features",
            instructions:
              "Look at the following statements (Questions 5–7) and the list of researchers below. Match each statement with the correct researcher, A–D.",
            sharedOptions: {
              title: "List of Researchers",
              items: [
                { key: "A", text: "Professor Ian Morgan" },
                { key: "B", text: "Dr. Donald Mutti" },
                { key: "C", text: "Professor Kathryn Rose" },
                { key: "D", text: "Dr. Pei-Chang Wu" },
              ],
            },
            questions: [
              {
                id: "q-myopia-5",
                groupId: "qg-myopia-2",
                questionNumber: 5,
                prompt:
                  "Argued that evolutionary changes in human DNA happen too slowly to explain the sudden rise in myopia.",
                correctAnswer: "A",
                explanation:
                  "Đoạn B: 'Morgan pointed out that gene pools cannot mutate across an entire population in just two generations.'",
                points: 1,
              },
              {
                id: "q-myopia-6",
                groupId: "qg-myopia-2",
                questionNumber: 6,
                prompt:
                  "Demonstrated that children do not need to play active sports outdoors to gain eye protection from daylight.",
                correctAnswer: "C",
                explanation:
                  "Đoạn D: 'Professor Kathryn Rose emphasized that the protective effect of being outside does not require vigorous physical sport...'",
                points: 1,
              },
              {
                id: "q-myopia-7",
                groupId: "qg-myopia-2",
                questionNumber: 7,
                prompt:
                  "Conducted a school experiment where classrooms were locked during break times to keep students outside.",
                correctAnswer: "D",
                explanation:
                  "Đoạn D: 'In clinical trials conducted in Taiwan by Dr. Pei-Chang Wu, primary schools that locked classroom doors during recess...'",
                points: 1,
              },
            ],
          },
          {
            id: "qg-myopia-3",
            partId: "part-myopia-1",
            orderIndex: 3,
            questionType: "GAP_FILL",
            title: "Questions 8 – 10: Gap Filling",
            instructions:
              "Complete the sentences below. Choose ONE WORD ONLY from the passage for each answer.",
            wordLimitNote: "ONE WORD ONLY",
            questions: [
              {
                id: "q-myopia-8",
                groupId: "qg-myopia-3",
                questionNumber: 8,
                prompt:
                  "Bright sunlight triggers the retina to produce ________, which stops the eyeball from growing too long.",
                correctAnswer: "dopamine",
                explanation:
                  "Đoạn C: '...bright natural daylight stimulates the release of a neurotransmitter called dopamine within the retina.'",
                points: 1,
              },
              {
                id: "q-myopia-9",
                groupId: "qg-myopia-3",
                questionNumber: 9,
                prompt:
                  "Taiwanese schools required students to go outdoors during ________ for 80 minutes every day.",
                correctAnswer: "recess",
                explanation:
                  "Đoạn D: '...primary schools that locked classroom doors during recess—forcing pupils into the courtyard for 80 minutes daily...'",
                points: 1,
              },
              {
                id: "q-myopia-10",
                groupId: "qg-myopia-3",
                questionNumber: 10,
                prompt:
                  "Optical engineers have created special ________ lenses to slow down eyeball elongation.",
                correctAnswer: "contact",
                explanation:
                  "Đoạn E: '...optical engineers have developed specialized contact lenses and atropine eye drops...'",
                points: 1,
              },
            ],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 3. READING PASSAGE 3: The Power of Strangers (Matches Screenshot 1 Card 3)
  // =========================================================================
  {
    id: "test-power-of-strangers",
    slug: "the-power-of-strangers",
    title: "[BluePass Collect] - The Power of Strangers",
    description:
      "Bài đọc Passage 3 khám phá tâm lý học xã hội đằng sau việc trò chuyện với người lạ và lợi ích sức khỏe tinh thần bất ngờ.",
    skill: "READING",
    mode: "SINGLE_PASSAGE",
    passageNumber: 3,
    source: "COLLECT_REAL",
    durationMinutes: 20,
    totalQuestions: 8,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80",
    attemptCount: 1673,
    questionTypesSummary: [
      "Gap Filling",
      "Multiple Choice (One Answer)",
      "Yes - No - Not Given",
    ],
    isPlacement: false,
    isPublished: true,
    createdAt: "2026-10-03T09:00:00.000Z",
    parts: [
      {
        id: "part-strangers-1",
        testId: "test-power-of-strangers",
        partNumber: 1,
        title: "READING PASSAGE 3",
        subtitle:
          "You should spend about 20 minutes on Questions 1–8, which are based on Reading Passage 3 below.",
        passageHtml: `
          <div class="space-y-4 leading-relaxed text-slate-800">
            <h2 class="text-xl font-bold text-slate-900">The Power of Strangers</h2>
            <p><strong>A.</strong> On commuter trains and in coffee shop queues around the world, millions of people deliberately avoid eye contact, retreating behind headphones and smartphone screens. Behavioural psychologists Nicholas Epley and Juliana Schroeder at the University of Chicago call this "the lesser minds problem" and "pluralistic ignorance": commuters systematically underestimate how interested strangers are in conversing with them.</p>
            <p><strong>B.</strong> In a famous series of experiments on Chicago rail lines, Epley and Schroeder instructed one group of passengers to strike up a conversation with the person sitting next to them, while another group was told to sit in <strong>solitude</strong> as usual. Before the experiment, participants predicted that talking to a stranger would feel awkward and exhausting. In reality, those who chatted reported a significantly more pleasant <strong>commute</strong> and no loss of productivity compared to the silent group.</p>
            <p><strong>C.</strong> Sociologist Mark Granovetter's classic theory of "weak ties" further highlights why casual acquaintances matter. While close friends and family provide deep emotional security, weak ties—such as a barista, a neighbour, or a fellow passenger—expose us to diverse information, novel career opportunities, and a broader sense of civic <strong>belonging</strong>.</p>
          </div>
        `,
        questionGroups: [
          {
            id: "qg-strangers-1",
            partId: "part-strangers-1",
            orderIndex: 1,
            questionType: "SINGLE_CHOICE",
            title: "Questions 1 – 2: Multiple Choice (One Answer)",
            instructions: "Choose the correct letter, A, B, C, or D.",
            questions: [
              {
                id: "q-strangers-1",
                groupId: "qg-strangers-1",
                questionNumber: 1,
                prompt:
                  "Why do commuters usually avoid speaking to people sitting near them on trains?",
                options: [
                  {
                    label: "A",
                    value: "A",
                    text: "They falsely assume that other passengers do not wish to talk.",
                  },
                  {
                    label: "B",
                    value: "B",
                    text: "Train regulations discourage loud conversations in carriages.",
                  },
                  {
                    label: "C",
                    value: "C",
                    text: "They prefer to save their energy for workplace meetings.",
                  },
                  {
                    label: "D",
                    value: "D",
                    text: "Past negative experiences have made them distrustful of strangers.",
                  },
                ],
                correctAnswer: "A",
                explanation:
                  "Đoạn A: '...commuters systematically underestimate how interested strangers are in conversing with them.'",
                points: 1,
              },
              {
                id: "q-strangers-2",
                groupId: "qg-strangers-1",
                questionNumber: 2,
                prompt:
                  "What did Mark Granovetter's theory of 'weak ties' emphasize?",
                options: [
                  {
                    label: "A",
                    value: "A",
                    text: "Casual acquaintances can connect us to new ideas and social inclusion.",
                  },
                  {
                    label: "B",
                    value: "B",
                    text: "Close family relationships are becoming less important in modern cities.",
                  },
                  {
                    label: "C",
                    value: "C",
                    text: "Coffee shop workers are more empathetic than office colleagues.",
                  },
                  {
                    label: "D",
                    value: "D",
                    text: "Weak ties frequently turn into lifelong friendships.",
                  },
                ],
                correctAnswer: "A",
                explanation:
                  "Đoạn C: '...weak ties... expose us to diverse information, novel career opportunities, and a broader sense of civic belonging.'",
                points: 1,
              },
            ],
          },
          {
            id: "qg-strangers-2",
            partId: "part-strangers-1",
            orderIndex: 2,
            questionType: "YNNG",
            title: "Questions 3 – 5: Yes / No / Not Given",
            instructions:
              "Do the following statements agree with the claims of the writer in Reading Passage 3? Choose YES, NO, or NOT GIVEN.",
            questions: [
              {
                id: "q-strangers-3",
                groupId: "qg-strangers-2",
                questionNumber: 3,
                prompt:
                  "Chicago train passengers accurately predicted how they would feel about talking to strangers.",
                options: [
                  { label: "YES", value: "YES", text: "YES" },
                  { label: "NO", value: "NO", text: "NO" },
                  { label: "NOT GIVEN", value: "NOT GIVEN", text: "NOT GIVEN" },
                ],
                correctAnswer: "NO",
                explanation:
                  "Đoạn B: Trước thí nghiệm họ dự đoán sẽ ngượng ngùng (awkward), nhưng thực tế lại rất vui vẻ.",
                points: 1,
              },
              {
                id: "q-strangers-4",
                groupId: "qg-strangers-2",
                questionNumber: 4,
                prompt:
                  "Talking to strangers on the train reduced the passengers' ability to get work done.",
                options: [
                  { label: "YES", value: "YES", text: "YES" },
                  { label: "NO", value: "NO", text: "NO" },
                  { label: "NOT GIVEN", value: "NOT GIVEN", text: "NOT GIVEN" },
                ],
                correctAnswer: "NO",
                explanation:
                  "Đoạn B: '...and no loss of productivity compared to the silent group.'",
                points: 1,
              },
              {
                id: "q-strangers-5",
                groupId: "qg-strangers-2",
                questionNumber: 5,
                prompt:
                  "Introverted participants enjoyed the Chicago train experiment more than extroverted ones.",
                options: [
                  { label: "YES", value: "YES", text: "YES" },
                  { label: "NO", value: "NO", text: "NO" },
                  { label: "NOT GIVEN", value: "NOT GIVEN", text: "NOT GIVEN" },
                ],
                correctAnswer: "NOT GIVEN",
                explanation:
                  "Bài đọc không so sánh mức độ yêu thích giữa người hướng nội và hướng ngoại.",
                points: 1,
              },
            ],
          },
          {
            id: "qg-strangers-3",
            partId: "part-strangers-1",
            orderIndex: 3,
            questionType: "GAP_FILL",
            title: "Questions 6 – 8: Summary Completion",
            instructions:
              "Complete the summary using ONE WORD ONLY from the passage for each answer.",
            wordLimitNote: "ONE WORD ONLY",
            questions: [
              {
                id: "q-strangers-6",
                groupId: "qg-strangers-3",
                questionNumber: 6,
                prompt:
                  "In the Chicago study, the control group was asked to remain in ________ during the journey.",
                correctAnswer: "solitude",
                explanation: "Đoạn B: '...told to sit in solitude as usual.'",
                points: 1,
              },
              {
                id: "q-strangers-7",
                groupId: "qg-strangers-3",
                questionNumber: 7,
                prompt:
                  "Passengers who conversed with neighbours experienced a much more enjoyable ________.",
                correctAnswer: "commute",
                explanation:
                  "Đoạn B: '...reported a significantly more pleasant commute'.",
                points: 1,
              },
              {
                id: "q-strangers-8",
                groupId: "qg-strangers-3",
                questionNumber: 8,
                prompt:
                  "Everyday interactions with weak ties foster a stronger feeling of community ________.",
                correctAnswer: "belonging",
                explanation:
                  "Đoạn C: '...and a broader sense of civic belonging.'",
                points: 1,
              },
            ],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 4. READING PASSAGE 2: The Great Lock Controversy of 1851 (Matches Screenshot 1 Card 4)
  // =========================================================================
  {
    id: "test-great-lock-1851",
    slug: "the-great-lock-controversy-of-1851",
    title: "[BluePass Collect] - The Great Lock Controversy of 1851",
    description:
      "Cuộc đối đầu lịch sử tại Triển lãm Crystal Palace Luân Đôn năm 1851 giữa thợ khóa Mỹ Alfred Charles Hobbs và các hãng khóa lừng danh nước Anh.",
    skill: "READING",
    mode: "SINGLE_PASSAGE",
    passageNumber: 2,
    source: "COLLECT_REAL",
    durationMinutes: 20,
    totalQuestions: 6,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80",
    attemptCount: 9781,
    questionTypesSummary: [
      "Gap Filling",
      "Matching Information",
      "Multiple Choice (Many Answers)",
    ],
    isPlacement: false,
    isPublished: true,
    createdAt: "2026-10-04T09:00:00.000Z",
    parts: [
      {
        id: "part-lock-1",
        testId: "test-great-lock-1851",
        partNumber: 1,
        title: "READING PASSAGE 2",
        subtitle: "The Great Lock Controversy of 1851",
        passageHtml: `
          <div class="space-y-4 leading-relaxed text-slate-800">
            <h2 class="text-xl font-bold text-slate-900">The Great Lock Controversy of 1851</h2>
            <p><strong>A.</strong> Throughout the early nineteenth century, British locksmiths Jeremiah Chubb and Joseph Bramah enjoyed an unshakeable reputation for building "unpickable" mechanical locks. Confident in its engineering, the Bramah company displayed a padlock in its London shop window for over sixty years, promising a reward of 200 <strong>guineas</strong> to anyone who could open it without the original key.</p>
            <p><strong>B.</strong> At the Great Exhibition of 1851 held in London's Crystal Palace, American locksmith Alfred Charles Hobbs stunned the British public. First, he picked Chubb's celebrated detector lock in just 25 minutes in front of independent witnesses. Next, he accepted the Bramah challenge. Working methodically over 16 days for a total of 51 hours using custom tension <strong>instruments</strong>, Hobbs successfully opened the prized padlock.</p>
            <p><strong>C.</strong> Although the Bramah directors initially protested that Hobbs had used specialized tools rather than a simple key, the arbitration committee ruled in Hobbs's favour and paid the reward. Far from ruining the British security industry, the scandal sparked a wave of mechanical <strong>innovation</strong> and patent improvements that made bank vaults and household doors far safer.</p>
          </div>
        `,
        questionGroups: [
          {
            id: "qg-lock-1",
            partId: "part-lock-1",
            orderIndex: 1,
            questionType: "MULTI_CHOICE",
            title: "Questions 1 – 2: Multiple Choice (Many Answers)",
            instructions:
              "Choose TWO letters, A–E. Which TWO facts are mentioned about Alfred Charles Hobbs's achievements in 1851?",
            questions: [
              {
                id: "q-lock-1",
                groupId: "qg-lock-1",
                questionNumber: 1,
                prompt:
                  "Select TWO true statements about Alfred Charles Hobbs at the 1851 Exhibition (counts as 2 points):",
                options: [
                  {
                    label: "A",
                    value: "A",
                    text: "He opened the Chubb detector lock in less than half an hour.",
                  },
                  {
                    label: "B",
                    value: "B",
                    text: "He damaged the internal springs of the Bramah lock permanently.",
                  },
                  {
                    label: "C",
                    value: "C",
                    text: "He received the prize money after a committee reviewed the dispute.",
                  },
                  {
                    label: "D",
                    value: "D",
                    text: "He refused to demonstrate his technique in front of witnesses.",
                  },
                  {
                    label: "E",
                    value: "E",
                    text: "He was employed by the British Royal Mint prior to 1851.",
                  },
                ],
                correctAnswer: "A|C",
                explanation:
                  "Đoạn B & C: Hobbs mở khóa Chubb trong 25 phút (< 30 phút -> A đúng) và ủy ban trọng tài đã phán quyết trao thưởng cho ông (C đúng).",
                points: 2,
              },
            ],
          },
          {
            id: "qg-lock-2",
            partId: "part-lock-1",
            orderIndex: 2,
            questionType: "GAP_FILL",
            title: "Questions 3 – 5: Gap Filling",
            instructions:
              "Complete the sentences below. Choose ONE WORD ONLY from the passage for each answer.",
            wordLimitNote: "ONE WORD ONLY",
            questions: [
              {
                id: "q-lock-3",
                groupId: "qg-lock-2",
                questionNumber: 3,
                prompt:
                  "The Bramah company offered a prize of 200 ________ to anyone who could pick its shop-window padlock.",
                correctAnswer: "guineas",
                explanation: "Đoạn A: '...promising a reward of 200 guineas...'",
                points: 1,
              },
              {
                id: "q-lock-4",
                groupId: "qg-lock-2",
                questionNumber: 4,
                prompt:
                  "Hobbs spent 51 hours using specially designed tension ________ to unlock the Bramah padlock.",
                correctAnswer: "instruments",
                explanation: "Đoạn B: '...using custom tension instruments...'",
                points: 1,
              },
              {
                id: "q-lock-5",
                groupId: "qg-lock-2",
                questionNumber: 5,
                prompt:
                  "Ultimately, the controversy stimulated a period of technical ________ in the British lock-making sector.",
                correctAnswer: "innovation",
                explanation:
                  "Đoạn C: '...sparked a wave of mechanical innovation and patent improvements...'",
                points: 1,
              },
            ],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 5. READING PASSAGE 2: The Evolutionary Mystery: Crocodiles (Matches Screenshot 2 Card 5)
  // =========================================================================
  {
    id: "test-evolutionary-mystery",
    slug: "the-evolutionary-mystery-crocodiles",
    title: "[BluePass Collect] - The Evolutionary Mystery: Crocodiles",
    description:
      "Khám phá bí ẩn tiến hóa của loài cá sấu suốt 200 triệu năm với dạng bài Matching Headings và Gap Filling.",
    skill: "READING",
    mode: "SINGLE_PASSAGE",
    passageNumber: 2,
    source: "COLLECT_REAL",
    durationMinutes: 20,
    totalQuestions: 6,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&w=800&q=80",
    attemptCount: 8184,
    questionTypesSummary: ["Gap Filling", "Matching Headings"],
    isPlacement: false,
    isPublished: true,
    createdAt: "2026-10-05T09:00:00.000Z",
    parts: [
      {
        id: "part-croc-1",
        testId: "test-evolutionary-mystery",
        partNumber: 1,
        title: "READING PASSAGE 2",
        subtitle: "The Evolutionary Mystery: How Crocodiles Outlived the Dinosaurs",
        passageHtml: `
          <div class="space-y-4 leading-relaxed text-slate-800">
            <p><strong>Paragraph A.</strong> Modern crocodiles are often referred to as "living fossils" because their semi-aquatic body plan has remained remarkably stable for nearly 85 million years. Equipped with armoured scales, powerful jaws, and nostrils positioned on top of the snout, they are supreme ambush predators.</p>
            <p><strong>Paragraph B.</strong> Yet fossil discoveries executed by palaeontologists at the University of Bristol reveal that prehistoric crocodylomorphs were far more diverse than today's survivors. During the Jurassic and Cretaceous periods, some ancient relatives were fast-running land herbivores with complex teeth, while others possessed flippers and lived entirely in open <strong>oceans</strong>.</p>
            <p><strong>Paragraph C.</strong> How did modern crocodiles survive the asteroid impact 66 million years ago that wiped out non-avian dinosaurs? Being cold-blooded ectotherms, crocodiles can slow their <strong>metabolism</strong> drastically and survive for up to a year without a single meal, allowing them to endure the prolonged darkness and food scarcity following the impact.</p>
          </div>
        `,
        questionGroups: [
          {
            id: "qg-croc-1",
            partId: "part-croc-1",
            orderIndex: 1,
            questionType: "MATCHING_HEADINGS",
            title: "Questions 1 – 3: Matching Headings",
            instructions:
              "Choose the correct heading for Paragraphs A–C from the list of headings (i–v) below.",
            sharedOptions: {
              title: "List of Headings",
              items: [
                { key: "i", text: "i. Biological traits that enabled survival during global catastrophe" },
                { key: "ii", text: "ii. Threats posed by modern habitat loss and poaching" },
                { key: "iii", text: "iii. An unchanged physical design suited for stealth hunting" },
                { key: "iv", text: "iv. Surprising variety among ancient crocodile ancestors" },
                { key: "v", text: "v. Commercial farming of reptiles in northern Australia" },
              ],
            },
            questions: [
              {
                id: "q-croc-1",
                groupId: "qg-croc-1",
                questionNumber: 1,
                prompt: "Paragraph A",
                correctAnswer: "iii",
                explanation: "Đoạn A mô tả cấu trúc cơ thể ổn định 85 triệu năm giúp phục kích con mồi.",
                points: 1,
              },
              {
                id: "q-croc-2",
                groupId: "qg-croc-1",
                questionNumber: 2,
                prompt: "Paragraph B",
                correctAnswer: "iv",
                explanation: "Đoạn B nói về sự đa dạng đáng kinh ngạc của tổ tiên cá sấu thời tiền sử.",
                points: 1,
              },
              {
                id: "q-croc-3",
                groupId: "qg-croc-1",
                questionNumber: 3,
                prompt: "Paragraph C",
                correctAnswer: "i",
                explanation: "Đoạn C giải thích cơ chế máu lạnh và trao đổi chất chậm giúp sống sót qua thảm họa thiên thạch.",
                points: 1,
              },
            ],
          },
          {
            id: "qg-croc-2",
            partId: "part-croc-1",
            orderIndex: 2,
            questionType: "GAP_FILL",
            title: "Questions 4 – 5: Gap Filling",
            instructions: "Choose ONE WORD ONLY from the passage for each answer.",
            wordLimitNote: "ONE WORD ONLY",
            questions: [
              {
                id: "q-croc-4",
                groupId: "qg-croc-2",
                questionNumber: 4,
                prompt: "Certain prehistoric relatives of crocodiles had flippers and inhabited open ________.",
                correctAnswer: "oceans|ocean",
                explanation: "Đoạn B: '...lived entirely in open oceans.'",
                points: 1,
              },
              {
                id: "q-croc-5",
                groupId: "qg-croc-2",
                questionNumber: 5,
                prompt: "Crocodiles can survive months without food by lowering their ________.",
                correctAnswer: "metabolism",
                explanation: "Đoạn C: '...crocodiles can slow their metabolism drastically...'",
                points: 1,
              },
            ],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 6. OFFICIAL PLACEMENT EXAM ("THI XẾP LỚP ĐẦU VÀO 2026")
  // =========================================================================
  {
    id: "test-placement-2026",
    slug: "de-thi-xep-lop-dau-vao-chuan-quoc-te-2026",
    title: "[Placement Test 2026] - Đề Thi Xếp Lớp Đầu Vào Chuẩn IELTS & Học Thuật",
    description:
      "Bài thi xếp lớp chính thức (Bật giám sát chống gian lận & đếm số lần chuyển tab). Kết quả được xếp hạng tự động và công bố tại Cổng Thông Báo Xếp Lớp.",
    skill: "READING",
    mode: "PLACEMENT",
    passageNumber: null,
    source: "PRO_PACKAGE",
    durationMinutes: 25,
    totalQuestions: 10,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
    attemptCount: 14908,
    questionTypesSummary: [
      "Multiple Choice (One Answer)",
      "True - False - Not Given",
      "Matching Headings",
      "Gap Filling",
    ],
    isPlacement: true,
    isPublished: true,
    createdAt: "2026-10-10T08:00:00.000Z",
    parts: [
      {
        id: "part-placement-1",
        testId: "test-placement-2026",
        partNumber: 1,
        title: "PART 1: ACADEMIC READING & COMPREHENSION",
        subtitle:
          "Read the passage on Urban Tiny Forests and complete Questions 1–10. Note: Tab switching is actively monitored during this Placement Exam.",
        passageHtml: `
          <div class="space-y-4 leading-relaxed text-slate-800">
            <h2 class="text-xl font-bold text-slate-900">The Rise of the Urban Tiny Forest</h2>
            <p><strong>Paragraph A.</strong> In densely populated cities across Europe and Asia, urban planners are transforming neglected parking lots and roadside strips—some no larger than a tennis court—into thriving miniature ecosystems. Inspired by Japanese botanist <strong>Akira Miyawaki</strong>, this method involves planting native saplings densely together, up to three trees per square metre.</p>
            <p><strong>Paragraph B.</strong> Unlike conventional municipal parks where single tree species are spaced far apart on manicured lawns, a Miyawaki forest layers four distinct botanical tiers: canopy trees, sub-tree species, shrubs, and ground-cover herbs. Because the young plants compete intensely for <strong>sunlight</strong>, they grow up to ten times faster than standard plantations and become completely self-sustaining within three years.</p>
            <p><strong>Paragraph C.</strong> Ecological researchers in the Netherlands led by Fabrice Ottburg monitored eleven urban mini-forests over two years. They discovered that these compact plots absorbed significantly more rainwater during flash floods and supported over 500 animal and insect species, including rare <strong>pollinators</strong> and songbirds.</p>
            <p><strong>Paragraph D.</strong> Critics occasionally note that initial soil preparation and high sapling density make the first-year installation cost per square metre relatively high. However, city councils point out that long-term <strong>maintenance</strong> expenses drop to almost zero once the forest canopy closes, as fallen leaves naturally fertilize the soil and suppress weeds.</p>
          </div>
        `,
        questionGroups: [
          {
            id: "qg-placement-1",
            partId: "part-placement-1",
            orderIndex: 1,
            questionType: "MATCHING_HEADINGS",
            title: "Questions 1 – 3: Matching Headings",
            instructions:
              "Choose the correct heading for Paragraphs B, C, and D from the list of headings below.",
            sharedOptions: {
              title: "List of Headings",
              items: [
                { key: "i", text: "i. How dense multi-layer planting accelerates tree growth" },
                { key: "ii", text: "ii. Financial trade-offs between setup costs and future upkeep" },
                { key: "iii", text: "iii. Measurable benefits for urban drainage and wildlife diversity" },
                { key: "iv", text: "iv. Legal disputes over commercial timber harvesting" },
              ],
            },
            questions: [
              {
                id: "q-place-1",
                groupId: "qg-placement-1",
                questionNumber: 1,
                prompt: "Paragraph B",
                correctAnswer: "i",
                explanation: "Đoạn B giải thích 4 tầng thực vật trồng dày đặc cạnh tranh ánh sáng giúp cây lớn nhanh gấp 10 lần.",
                points: 1,
              },
              {
                id: "q-place-2",
                groupId: "qg-placement-1",
                questionNumber: 2,
                prompt: "Paragraph C",
                correctAnswer: "iii",
                explanation: "Đoạn C nêu kết quả nghiên cứu ở Hà Lan về hấp thụ nước mưa và hơn 500 loài sinh vật.",
                points: 1,
              },
              {
                id: "q-place-3",
                groupId: "qg-placement-1",
                questionNumber: 3,
                prompt: "Paragraph D",
                correctAnswer: "ii",
                explanation: "Đoạn D bàn về chi phí lắp đặt ban đầu cao nhưng chi phí bảo trì dài hạn gần bằng 0.",
                points: 1,
              },
            ],
          },
          {
            id: "qg-placement-2",
            partId: "part-placement-1",
            orderIndex: 2,
            questionType: "TFNG",
            title: "Questions 4 – 6: True / False / Not Given",
            instructions:
              "Do the following statements agree with the information in the passage?",
            questions: [
              {
                id: "q-place-4",
                groupId: "qg-placement-2",
                questionNumber: 4,
                prompt:
                  "A Miyawaki tiny forest requires regular watering and weeding for at least ten years.",
                options: [
                  { label: "TRUE", value: "TRUE", text: "TRUE" },
                  { label: "FALSE", value: "FALSE", text: "FALSE" },
                  { label: "NOT GIVEN", value: "NOT GIVEN", text: "NOT GIVEN" },
                ],
                correctAnswer: "FALSE",
                explanation:
                  "Đoạn B: '...become completely self-sustaining within three years' (chỉ sau 3 năm đã tự duy trì).",
                points: 1,
              },
              {
                id: "q-place-5",
                groupId: "qg-placement-2",
                questionNumber: 5,
                prompt:
                  "Fabrice Ottburg's team found that tiny forests helped reduce flooding from heavy rain.",
                options: [
                  { label: "TRUE", value: "TRUE", text: "TRUE" },
                  { label: "FALSE", value: "FALSE", text: "FALSE" },
                  { label: "NOT GIVEN", value: "NOT GIVEN", text: "NOT GIVEN" },
                ],
                correctAnswer: "TRUE",
                explanation:
                  "Đoạn C: '...absorbed significantly more rainwater during flash floods...'",
                points: 1,
              },
              {
                id: "q-place-6",
                groupId: "qg-placement-2",
                questionNumber: 6,
                prompt:
                  "Akira Miyawaki personally designed the eleven mini-forests studied in the Netherlands.",
                options: [
                  { label: "TRUE", value: "TRUE", text: "TRUE" },
                  { label: "FALSE", value: "FALSE", text: "FALSE" },
                  { label: "NOT GIVEN", value: "NOT GIVEN", text: "NOT GIVEN" },
                ],
                correctAnswer: "NOT GIVEN",
                explanation:
                  "Bài đọc chỉ nói phương pháp lấy cảm hứng từ Akira Miyawaki, không nói ông trực tiếp thiết kế 11 khu rừng ở Hà Lan.",
                points: 1,
              },
            ],
          },
          {
            id: "qg-placement-3",
            partId: "part-placement-1",
            orderIndex: 3,
            questionType: "GAP_FILL",
            title: "Questions 7 – 10: Gap Filling & Vocabulary Precision",
            instructions:
              "Complete the notes below. Write ONE WORD ONLY from the passage for each answer.",
            wordLimitNote: "ONE WORD ONLY",
            questions: [
              {
                id: "q-place-7",
                groupId: "qg-placement-3",
                questionNumber: 7,
                prompt:
                  "Saplings planted close together grow rapidly because they must compete for ________.",
                correctAnswer: "sunlight|light",
                explanation:
                  "Đoạn B: 'Because the young plants compete intensely for sunlight, they grow up to ten times faster...'",
                points: 1,
              },
              {
                id: "q-place-8",
                groupId: "qg-placement-3",
                questionNumber: 8,
                prompt:
                  "Dutch researchers recorded over 500 species in the mini-forests, including songbirds and rare ________.",
                correctAnswer: "pollinators|pollinator",
                explanation:
                  "Đoạn C: '...including rare pollinators and songbirds.'",
                points: 1,
              },
              {
                id: "q-place-9",
                groupId: "qg-placement-3",
                questionNumber: 9,
                prompt:
                  "Once the tree canopy closes, ongoing ________ costs fall to nearly zero.",
                correctAnswer: "maintenance",
                explanation:
                  "Đoạn D: '...long-term maintenance expenses drop to almost zero once the forest canopy closes...'",
                points: 1,
              },
              {
                id: "q-place-10",
                groupId: "qg-placement-3",
                questionNumber: 10,
                prompt:
                  "Grammar Check: 'Neither the initial budget nor the ongoing expenses ________ considered excessive by the council.' (Choose: was / were)",
                correctAnswer: "were",
                explanation:
                  "Cấu trúc Neither A nor B chia động từ theo chủ ngữ gần nhất ('the ongoing expenses' số nhiều -> were).",
                points: 1,
              },
            ],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 7. LISTENING PART 1: Northside Community Sports Centre (Audio + Map + Gap Fill)
  // =========================================================================
  {
    id: "test-listening-sports-centre",
    slug: "cambridge-c19-northside-sports-centre",
    title: "[Cambridge C19] - Part 1: Northside Community Sports Centre",
    description:
      "Bài nghe IELTS Listening Part 1 kèm Audio Player hỗ trợ HTTP Range streaming, điền từ Gap Filling và định vị sơ đồ Map Labelling.",
    skill: "LISTENING",
    mode: "SINGLE_PASSAGE",
    passageNumber: 1,
    source: "CAMBRIDGE_C10_C20",
    durationMinutes: 15,
    totalQuestions: 6,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
    attemptCount: 6420,
    questionTypesSummary: [
      "Gap Filling",
      "Map, Diagram Label",
      "Multiple Choice (One Answer)",
    ],
    isPlacement: false,
    isPublished: true,
    createdAt: "2026-10-06T09:00:00.000Z",
    parts: [
      {
        id: "part-listen-1",
        testId: "test-listening-sports-centre",
        partNumber: 1,
        title: "LISTENING SECTION 1",
        subtitle:
          "Listen to the conversation between a receptionist and a new member registering at Northside Community Sports Centre, then answer Questions 1–6.",
        audioUrl: "/api/audio/northside-sports-centre",
        audioTranscript: `
          Receptionist: Good morning, Northside Community Sports Centre. How can I help you?
          Member: Hi! I'd like to inquire about joining the centre and booking a few classes.
          Receptionist: Certainly. Let me take down a few details first. If you opt for our Gold Annual Membership, the monthly fee is 45 pounds, and that includes free access to the heated swimming pool and sauna.
          Member: Great. Are there any beginner badminton sessions this week?
          Receptionist: Yes, coach David runs the beginner badminton clinic every Thursday evening at 7:00 PM. Players just need to bring indoor court shoes with non-marking soles; we provide all rackets and shuttlecocks.
          Member: Perfect! And if I come by car, where is the best place to park?
          Receptionist: When you enter through the Main Gate on Oak Road, you'll see the Reception Building directly ahead. Turn left immediately after the gate—Zone A next to the rose garden is our dedicated Member Car Park. If you walk past the Reception Building towards the back of the complex, the Olympic Swimming Pool is located in Zone C, right opposite the Squash Courts.
        `,
        questionGroups: [
          {
            id: "qg-listen-1",
            partId: "part-listen-1",
            orderIndex: 1,
            questionType: "GAP_FILL",
            title: "Questions 1 – 3: Form Completion (Gap Filling)",
            instructions:
              "Complete the membership notes below. Write ONE WORD AND/OR A NUMBER for each answer.",
            wordLimitNote: "ONE WORD AND/OR A NUMBER",
            questions: [
              {
                id: "q-listen-1",
                groupId: "qg-listen-1",
                questionNumber: 1,
                prompt: "Gold Membership monthly cost: £ ________ (includes pool & sauna).",
                correctAnswer: "45|forty-five|45 pounds",
                explanation:
                  "Audio script: '...the monthly fee is 45 pounds, and that includes free access to the heated swimming pool and sauna.'",
                points: 1,
              },
              {
                id: "q-listen-2",
                groupId: "qg-listen-1",
                questionNumber: 2,
                prompt: "Beginner badminton clinic day: Every ________ at 7:00 PM.",
                correctAnswer: "thursday|thursdays",
                explanation:
                  "Audio script: '...coach David runs the beginner badminton clinic every Thursday evening at 7:00 PM.'",
                points: 1,
              },
              {
                id: "q-listen-3",
                groupId: "qg-listen-1",
                questionNumber: 3,
                prompt: "Equipment required from members: Indoor court ________.",
                correctAnswer: "shoes|shoe|trainers",
                explanation:
                  "Audio script: 'Players just need to bring indoor court shoes with non-marking soles...'",
                points: 1,
              },
            ],
          },
          {
            id: "qg-listen-2",
            partId: "part-listen-1",
            orderIndex: 2,
            questionType: "MAP_DIAGRAM_LABEL",
            title: "Questions 4 – 5: Map / Diagram Labelling",
            instructions:
              "Choose the correct zone letter (A, B, C, or D) from the Northside Sports Complex map.",
            sharedOptions: {
              title: "Northside Sports Complex Map Zones",
              items: [
                { key: "A", text: "Zone A (Left of Main Gate, beside Rose Garden)" },
                { key: "B", text: "Zone B (East Wing Café & Lounge)" },
                { key: "C", text: "Zone C (Rear Complex, opposite Squash Courts)" },
                { key: "D", text: "Zone D (Outdoor Tennis Pavilion)" },
              ],
            },
            questions: [
              {
                id: "q-listen-4",
                groupId: "qg-listen-2",
                questionNumber: 4,
                prompt: "Member Car Park: ________",
                correctAnswer: "A",
                explanation:
                  "Audio script: 'Turn left immediately after the gate—Zone A next to the rose garden is our dedicated Member Car Park.'",
                points: 1,
              },
              {
                id: "q-listen-5",
                groupId: "qg-listen-2",
                questionNumber: 5,
                prompt: "Olympic Swimming Pool: ________",
                correctAnswer: "C",
                explanation:
                  "Audio script: '...the Olympic Swimming Pool is located in Zone C, right opposite the Squash Courts.'",
                points: 1,
              },
            ],
          },
          {
            id: "qg-listen-3",
            partId: "part-listen-1",
            orderIndex: 3,
            questionType: "SINGLE_CHOICE",
            title: "Question 6: Multiple Choice",
            instructions: "Choose the correct letter, A, B, or C.",
            questions: [
              {
                id: "q-listen-6",
                groupId: "qg-listen-3",
                questionNumber: 6,
                prompt: "What does the centre provide free of charge for the badminton clinic?",
                options: [
                  { label: "A", value: "A", text: "Sports towels and energy drinks" },
                  { label: "B", value: "B", text: "Rackets and shuttlecocks" },
                  { label: "C", value: "C", text: "Non-marking court shoes" },
                ],
                correctAnswer: "B",
                explanation:
                  "Audio script: '...we provide all rackets and shuttlecocks.'",
                points: 1,
              },
            ],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // ADDITIONAL CARDS REPLICATING SCREENSHOT 1 & SCREENSHOT 2 GRID
  // =========================================================================
  {
    id: "test-in-defence-of-forgetting",
    slug: "simulation-q3-in-defence-of-forgetting",
    title: "[Simulation Q3] In defence of forgetting",
    description:
      "Tại sao bộ não con người chủ động xóa bỏ ký ức không cần thiết để tối ưu hóa khả năng ra quyết định.",
    skill: "READING",
    mode: "SINGLE_PASSAGE",
    passageNumber: 3,
    source: "SIMULATION",
    durationMinutes: 20,
    totalQuestions: 5,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80",
    attemptCount: 1526,
    questionTypesSummary: [
      "Gap Filling",
      "Multiple Choice (One Answer)",
      "Yes - No - Not Given",
    ],
    isPlacement: false,
    isPublished: true,
    createdAt: "2026-10-07T09:00:00.000Z",
    parts: [
      {
        id: "part-forgetting-1",
        testId: "test-in-defence-of-forgetting",
        partNumber: 1,
        title: "READING PASSAGE 3",
        subtitle: "In Defence of Forgetting",
        passageHtml: `
          <div class="space-y-4 leading-relaxed text-slate-800">
            <h2 class="text-xl font-bold text-slate-900">In Defence of Forgetting</h2>
            <p><strong>A.</strong> For over a century, neuroscientists treated memory loss solely as a mechanical failure of the brain. However, recent neurobiological studies conducted by Professor Blake Richards at the University of Toronto suggest that active forgetting is actually an adaptive <strong>strategy</strong> designed to help humans generalize from past experiences rather than getting trapped by outdated details.</p>
            <p><strong>B.</strong> In the hippocampus, the continuous birth of new neurons—a process known as <strong>neurogenesis</strong>—gradually overwrites older synaptic connections. Far from being a defect, clearing away trivial everyday data prevents cognitive overload and allows decision-makers to adapt rapidly to changing <strong>environments</strong>.</p>
          </div>
        `,
        questionGroups: [
          {
            id: "qg-forget-1",
            partId: "part-forgetting-1",
            orderIndex: 1,
            questionType: "GAP_FILL",
            title: "Questions 1 – 3: Gap Filling",
            instructions: "Choose ONE WORD ONLY from the passage for each answer.",
            wordLimitNote: "ONE WORD ONLY",
            questions: [
              {
                id: "q-forget-1",
                groupId: "qg-forget-1",
                questionNumber: 1,
                prompt: "Blake Richards argues that forgetting is an evolutionary ________ rather than a brain malfunction.",
                correctAnswer: "strategy",
                explanation: "Đoạn A: '...active forgetting is actually an adaptive strategy...'",
                points: 1,
              },
              {
                id: "q-forget-2",
                groupId: "qg-forget-1",
                questionNumber: 2,
                prompt: "The formation of new brain cells in the hippocampus is called ________.",
                correctAnswer: "neurogenesis",
                explanation: "Đoạn B: '...the continuous birth of new neurons—a process known as neurogenesis...'",
                points: 1,
              },
              {
                id: "q-forget-3",
                groupId: "qg-forget-1",
                questionNumber: 3,
                prompt: "Erasing minor details helps humans adjust quickly to new ________.",
                correctAnswer: "environments|environment",
                explanation: "Đoạn B: '...allows decision-makers to adapt rapidly to changing environments.'",
                points: 1,
              },
            ],
          },
          {
            id: "qg-forget-2",
            partId: "part-forgetting-1",
            orderIndex: 2,
            questionType: "YNNG",
            title: "Questions 4 – 5: Yes / No / Not Given",
            instructions: "Do the following statements agree with the claims of the writer?",
            questions: [
              {
                id: "q-forget-4",
                groupId: "qg-forget-2",
                questionNumber: 4,
                prompt: "Remembering every single detail from the past always leads to better decision-making.",
                options: [
                  { label: "YES", value: "YES", text: "YES" },
                  { label: "NO", value: "NO", text: "NO" },
                  { label: "NOT GIVEN", value: "NOT GIVEN", text: "NOT GIVEN" },
                ],
                correctAnswer: "NO",
                explanation: "Đoạn A & B khẳng định việc xóa chi tiết vụn vặt mới giúp tránh quá tải nhận thức và ra quyết định tốt hơn.",
                points: 1,
              },
              {
                id: "q-forget-5",
                groupId: "qg-forget-2",
                questionNumber: 5,
                prompt: "Neurogenesis occurs more rapidly in children than in adults.",
                options: [
                  { label: "YES", value: "YES", text: "YES" },
                  { label: "NO", value: "NO", text: "NO" },
                  { label: "NOT GIVEN", value: "NOT GIVEN", text: "NOT GIVEN" },
                ],
                correctAnswer: "NOT GIVEN",
                explanation: "Bài đọc không so sánh tốc độ neurogenesis giữa trẻ em và người lớn.",
                points: 1,
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: "test-small-languages-smartphone",
    slug: "simulation-q3-small-languages-and-the-smartphone",
    title: "[Simulation Q3] Small languages and the smartphone",
    description:
      "Vai trò của công nghệ di động và bàn phím thông minh trong việc bảo tồn các ngôn ngữ thiểu số có nguy cơ tuyệt chủng.",
    skill: "READING",
    mode: "SINGLE_PASSAGE",
    passageNumber: 2,
    source: "SIMULATION",
    durationMinutes: 20,
    totalQuestions: 5,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
    attemptCount: 3233,
    questionTypesSummary: [
      "Gap Filling",
      "Matching Information",
      "Multiple Choice (Many Answers)",
    ],
    isPlacement: false,
    isPublished: true,
    createdAt: "2026-10-08T09:00:00.000Z",
    parts: [
      {
        id: "part-lang-1",
        testId: "test-small-languages-smartphone",
        partNumber: 1,
        title: "READING PASSAGE 2",
        subtitle: "Small Languages and the Smartphone",
        passageHtml: `
          <div class="space-y-4 leading-relaxed text-slate-800">
            <h2 class="text-xl font-bold text-slate-900">Small Languages and the Smartphone</h2>
            <p><strong>A.</strong> Linguists estimate that nearly half of the world's 7,000 spoken languages could vanish by the end of this century. Yet in remote regions of the Andes and Arctic, young speakers are using smartphones, voice messaging, and custom predictive <strong>keyboards</strong> to revitalize ancestral tongues that lack traditional printed textbooks.</p>
            <p><strong>B.</strong> Digital activist Rodrigo Pérez developed an open-source mobile dictionary for indigenous communities in Oaxaca, enabling teenagers to share folk stories via podcast and social media. When a minority language appears on a sleek touchscreen, its social <strong>prestige</strong> among youth rises dramatically.</p>
          </div>
        `,
        questionGroups: [
          {
            id: "qg-lang-1",
            partId: "part-lang-1",
            orderIndex: 1,
            questionType: "GAP_FILL",
            title: "Questions 1 – 2: Gap Filling",
            instructions: "Choose ONE WORD ONLY from the passage.",
            wordLimitNote: "ONE WORD ONLY",
            questions: [
              {
                id: "q-lang-1",
                groupId: "qg-lang-1",
                questionNumber: 1,
                prompt: "Young people are preserving indigenous tongues using voice messages and custom ________.",
                correctAnswer: "keyboards|keyboard",
                explanation: "Đoạn A: '...using smartphones, voice messaging, and custom predictive keyboards...'",
                points: 1,
              },
              {
                id: "q-lang-2",
                groupId: "qg-lang-1",
                questionNumber: 2,
                prompt: "Seeing an indigenous language on smartphones increases its ________ among teenagers.",
                correctAnswer: "prestige",
                explanation: "Đoạn B: '...its social prestige among youth rises dramatically.'",
                points: 1,
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: "test-learning-to-mend-again",
    slug: "simulation-q3-learning-to-mend-again",
    title: "[Simulation Q3] Learning to mend again",
    description:
      "Phong trào sửa chữa quần áo và đồ gia dụng bền vững chống lại văn hóa thời trang nhanh (Fast Fashion).",
    skill: "READING",
    mode: "SINGLE_PASSAGE",
    passageNumber: 2,
    source: "SIMULATION",
    durationMinutes: 20,
    totalQuestions: 5,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
    attemptCount: 3025,
    questionTypesSummary: [
      "Gap Filling",
      "Matching Features",
      "Matching Information",
    ],
    isPlacement: false,
    isPublished: true,
    createdAt: "2026-10-08T10:00:00.000Z",
    parts: [
      {
        id: "part-mend-1",
        testId: "test-learning-to-mend-again",
        partNumber: 1,
        title: "READING PASSAGE 2",
        subtitle: "Learning to Mend Again",
        passageHtml: `
          <div class="space-y-4 leading-relaxed text-slate-800">
            <h2 class="text-xl font-bold text-slate-900">Learning to Mend Again</h2>
            <p><strong>A.</strong> Across Europe and Japan, community "Repair Cafés" and visible mending workshops—inspired by the traditional Japanese craft of <em>sashiko</em> stitching—are teaching citizens to darn woollen sweaters and patch denim jeans rather than sending torn garments to <strong>landfill</strong>.</p>
          </div>
        `,
        questionGroups: [
          {
            id: "qg-mend-1",
            partId: "part-mend-1",
            orderIndex: 1,
            questionType: "GAP_FILL",
            title: "Question 1: Gap Filling",
            instructions: "Choose ONE WORD ONLY from the passage.",
            questions: [
              {
                id: "q-mend-1",
                groupId: "qg-mend-1",
                questionNumber: 1,
                prompt: "Mending workshops help prevent damaged clothing from ending up in ________.",
                correctAnswer: "landfill|landfills",
                explanation: "Đoạn A: '...rather than sending torn garments to landfill.'",
                points: 1,
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: "test-world-cup-ball",
    slug: "the-world-cup-ball",
    title: "[BluePass Collect] - The World Cup ball",
    description:
      "Sự tiến hóa công nghệ khí động học của trái bóng World Cup từ chất liệu da khâu tay năm 1930 đến cảm biến nhiệt ép hiện đại.",
    skill: "READING",
    mode: "SINGLE_PASSAGE",
    passageNumber: 1,
    source: "COLLECT_REAL",
    durationMinutes: 20,
    totalQuestions: 5,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80",
    attemptCount: 5133,
    questionTypesSummary: ["Gap Filling", "True - False - Not Given"],
    isPlacement: false,
    isPublished: true,
    createdAt: "2026-10-09T08:00:00.000Z",
    parts: [
      {
        id: "part-ball-1",
        testId: "test-world-cup-ball",
        partNumber: 1,
        title: "READING PASSAGE 1",
        subtitle: "The Evolution of the World Cup Football",
        passageHtml: `
          <div class="space-y-4 leading-relaxed text-slate-800">
            <p><strong>A.</strong> Early footballs used in the 1930 tournament were stitched from heavy cowhide <strong>leather</strong>, which absorbed rainwater rapidly and became dangerously heavy to head during wet matches. Modern tournament balls use thermally bonded synthetic panels tested inside wind tunnels.</p>
          </div>
        `,
        questionGroups: [
          {
            id: "qg-ball-1",
            partId: "part-ball-1",
            orderIndex: 1,
            questionType: "GAP_FILL",
            title: "Question 1: Gap Filling",
            instructions: "Choose ONE WORD ONLY from the passage.",
            questions: [
              {
                id: "q-ball-1",
                groupId: "qg-ball-1",
                questionNumber: 1,
                prompt: "In 1930, World Cup balls were made of heavy ________ that soaked up water.",
                correctAnswer: "leather",
                explanation: "Đoạn A: '...stitched from heavy cowhide leather, which absorbed rainwater rapidly...'",
                points: 1,
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: "test-carnivorous-plants",
    slug: "carnivorous-plants",
    title: "[BluePass Collect] - Carnivorous Plants",
    description:
      "Cơ chế bẫy côn trùng kỳ diệu của các loài thực vật ăn thịt như Venus Flytrap và cây nắp ấm ở vùng đất nghèo dinh dưỡng.",
    skill: "READING",
    mode: "SINGLE_PASSAGE",
    passageNumber: 1,
    source: "COLLECT_REAL",
    durationMinutes: 20,
    totalQuestions: 5,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80",
    attemptCount: 9268,
    questionTypesSummary: ["Gap Filling", "True - False - Not Given"],
    isPlacement: false,
    isPublished: true,
    createdAt: "2026-10-09T11:00:00.000Z",
    parts: [
      {
        id: "part-plants-1",
        testId: "test-carnivorous-plants",
        partNumber: 1,
        title: "READING PASSAGE 1",
        subtitle: "Carnivorous Plants",
        passageHtml: `
          <div class="space-y-4 leading-relaxed text-slate-800">
            <p><strong>A.</strong> Growing in acidic bogs where soil <strong>nitrogen</strong> is scarce, the Venus flytrap captures insects using modified leaves lined with sensitive trigger hairs.</p>
          </div>
        `,
        questionGroups: [
          {
            id: "qg-plants-1",
            partId: "part-plants-1",
            orderIndex: 1,
            questionType: "GAP_FILL",
            title: "Question 1: Gap Filling",
            instructions: "Choose ONE WORD ONLY from the passage.",
            questions: [
              {
                id: "q-plants-1",
                groupId: "qg-plants-1",
                questionNumber: 1,
                prompt: "Carnivorous plants thrive in bogs that lack sufficient ________ in the soil.",
                correctAnswer: "nitrogen",
                explanation: "Đoạn A: 'Growing in acidic bogs where soil nitrogen is scarce...'",
                points: 1,
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: "test-art-based-training-engineers",
    slug: "actual-test-art-based-training-for-engineers",
    title: "[Actual Test] - Art-based training for engineers",
    description:
      "Ứng dụng hội họa, sân khấu và thiết kế nghệ thuật vào chương trình đào tạo kỹ sư công nghệ nhằm khơi dậy tư duy sáng tạo.",
    skill: "READING",
    mode: "SINGLE_PASSAGE",
    passageNumber: 3,
    source: "ACTUAL_TESTS",
    durationMinutes: 20,
    totalQuestions: 5,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    attemptCount: 4190,
    questionTypesSummary: ["Gap Filling", "Multiple Choice (One Answer)"],
    isPlacement: false,
    isPublished: true,
    createdAt: "2026-10-10T10:00:00.000Z",
    parts: [
      {
        id: "part-art-1",
        testId: "test-art-based-training-engineers",
        partNumber: 1,
        title: "READING PASSAGE 3",
        subtitle: "Art-Based Training for Engineers",
        passageHtml: `
          <div class="space-y-4 leading-relaxed text-slate-800">
            <p><strong>A.</strong> Leading engineering faculties are introducing theatrical improvisation and sketching workshops to strengthen spatial <strong>empathy</strong> and collaborative problem-solving among software and mechanical engineers.</p>
          </div>
        `,
        questionGroups: [
          {
            id: "qg-art-1",
            partId: "part-art-1",
            orderIndex: 1,
            questionType: "GAP_FILL",
            title: "Question 1: Gap Filling",
            instructions: "Choose ONE WORD ONLY from the passage.",
            questions: [
              {
                id: "q-art-1",
                groupId: "qg-art-1",
                questionNumber: 1,
                prompt: "Art workshops help engineers cultivate greater ________ when designing for human users.",
                correctAnswer: "empathy",
                explanation: "Đoạn A: '...strengthen spatial empathy and collaborative problem-solving...'",
                points: 1,
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: "test-full-reading-cambridge-20",
    slug: "cambridge-c20-full-reading-test-1",
    title: "[Cambridge C20] - Full Test 01: Academic Reading (3 Passages)",
    description:
      "Đề thi Full Reading 60 phút gồm 3 Passages chuẩn cấu trúc thi máy IELTS Academic.",
    skill: "READING",
    mode: "FULL_TEST",
    passageNumber: null,
    source: "CAMBRIDGE_C10_C20",
    durationMinutes: 60,
    totalQuestions: 10,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
    attemptCount: 11240,
    questionTypesSummary: [
      "Matching Headings",
      "True - False - Not Given",
      "Multiple Choice (One Answer)",
      "Gap Filling",
    ],
    isPlacement: false,
    isPublished: true,
    createdAt: "2026-10-11T08:00:00.000Z",
    parts: [
      {
        id: "part-full-1",
        testId: "test-full-reading-cambridge-20",
        partNumber: 1,
        title: "FULL TEST: PASSAGES 1 - 3",
        subtitle: "Complete all questions within 60 minutes.",
        passageHtml: `
          <div class="space-y-4 leading-relaxed text-slate-800">
            <h2 class="text-xl font-bold text-slate-900">The Architecture of Ancient Aqueducts</h2>
            <p><strong>A.</strong> Roman civil engineers constructed vast networks of stone channels and arches to transport fresh mountain spring water across valleys into urban bathhouses and public <strong>fountains</strong>, relying entirely on subtle gradients of gravity rather than mechanical pumps.</p>
          </div>
        `,
        questionGroups: [
          {
            id: "qg-full-1",
            partId: "part-full-1",
            orderIndex: 1,
            questionType: "GAP_FILL",
            title: "Question 1: Gap Filling",
            instructions: "Choose ONE WORD ONLY from the passage.",
            questions: [
              {
                id: "q-full-1",
                groupId: "qg-full-1",
                questionNumber: 1,
                prompt: "Roman aqueducts delivered clean water to city bathhouses and public ________.",
                correctAnswer: "fountains|fountain",
                explanation: "Đoạn A: '...into urban bathhouses and public fountains...'",
                points: 1,
              },
            ],
          },
        ],
      },
    ],
  },
];

// ============================================================================
// PRE-SEEDED STUDENT SUBMISSIONS FOR ADMIN SCORE RANKING & CSV EXPORT
// Sorted dynamically by: rawScore DESC -> timeSpentSeconds ASC -> tabSwitchCount ASC
// ============================================================================
export const INITIAL_ATTEMPTS: TestAttemptItem[] = [
  {
    id: "att-rank-1",
    userId: "u-rank-1",
    userFullName: "Phạm Ngọc Bảo Trân",
    userEmail: "baotran.pham@student.edu.vn",
    userStudentCode: "HV-2026-1001",
    testId: "test-placement-2026",
    testTitle: "[Placement Test 2026] - Đề Thi Xếp Lớp Đầu Vào Chuẩn IELTS & Học Thuật",
    testSkill: "READING",
    isPlacement: true,
    status: "SUBMITTED",
    startedAt: "2026-10-25T08:00:00.000Z",
    expiresAt: "2026-10-25T08:25:00.000Z",
    submittedAt: "2026-10-25T08:14:12.000Z",
    draftAnswers: {},
    flaggedQuestions: [],
    rawScore: 10,
    totalQuestions: 10,
    percentageScore: 100,
    bandScore: 9.0,
    timeSpentSeconds: 852,
    tabSwitchCount: 0,
  },
  {
    id: "att-rank-2",
    userId: "u-rank-2",
    userFullName: "Lê Hoàng Minh Quân",
    userEmail: "minhquan.le@student.edu.vn",
    userStudentCode: "HV-2026-1015",
    testId: "test-placement-2026",
    testTitle: "[Placement Test 2026] - Đề Thi Xếp Lớp Đầu Vào Chuẩn IELTS & Học Thuật",
    testSkill: "READING",
    isPlacement: true,
    status: "SUBMITTED",
    startedAt: "2026-10-25T08:00:00.000Z",
    expiresAt: "2026-10-25T08:25:00.000Z",
    submittedAt: "2026-10-25T08:16:30.000Z",
    draftAnswers: {},
    flaggedQuestions: [],
    rawScore: 10,
    totalQuestions: 10,
    percentageScore: 100,
    bandScore: 9.0,
    timeSpentSeconds: 990,
    tabSwitchCount: 0,
  },
  {
    id: "att-rank-3",
    userId: "user-student-1",
    userFullName: "Nguyễn Minh Khôi",
    userEmail: "hocvien@bluepass.edu.vn",
    userStudentCode: "HV-2026-1042",
    testId: "test-placement-2026",
    testTitle: "[Placement Test 2026] - Đề Thi Xếp Lớp Đầu Vào Chuẩn IELTS & Học Thuật",
    testSkill: "READING",
    isPlacement: true,
    status: "SUBMITTED",
    startedAt: "2026-10-25T09:00:00.000Z",
    expiresAt: "2026-10-25T09:25:00.000Z",
    submittedAt: "2026-10-25T09:15:40.000Z",
    draftAnswers: {},
    flaggedQuestions: [],
    rawScore: 9,
    totalQuestions: 10,
    percentageScore: 90,
    bandScore: 8.0,
    timeSpentSeconds: 940,
    tabSwitchCount: 0,
  },
  {
    id: "att-rank-4",
    userId: "u-rank-4",
    userFullName: "Đỗ Thùy Dương",
    userEmail: "thuyduong.do@student.edu.vn",
    userStudentCode: "HV-2026-1028",
    testId: "test-placement-2026",
    testTitle: "[Placement Test 2026] - Đề Thi Xếp Lớp Đầu Vào Chuẩn IELTS & Học Thuật",
    testSkill: "READING",
    isPlacement: true,
    status: "SUBMITTED",
    startedAt: "2026-10-25T09:00:00.000Z",
    expiresAt: "2026-10-25T09:25:00.000Z",
    submittedAt: "2026-10-25T09:17:10.000Z",
    draftAnswers: {},
    flaggedQuestions: [],
    rawScore: 8,
    totalQuestions: 10,
    percentageScore: 80,
    bandScore: 7.5,
    timeSpentSeconds: 1030,
    tabSwitchCount: 1,
  },
  {
    id: "att-rank-5",
    userId: "u-rank-5",
    userFullName: "Võ Quốc Tuấn",
    userEmail: "quoctuan.vo@student.edu.vn",
    userStudentCode: "HV-2026-1055",
    testId: "test-placement-2026",
    testTitle: "[Placement Test 2026] - Đề Thi Xếp Lớp Đầu Vào Chuẩn IELTS & Học Thuật",
    testSkill: "READING",
    isPlacement: true,
    status: "SUBMITTED",
    startedAt: "2026-10-25T10:00:00.000Z",
    expiresAt: "2026-10-25T10:25:00.000Z",
    submittedAt: "2026-10-25T10:18:05.000Z",
    draftAnswers: {},
    flaggedQuestions: [],
    rawScore: 8,
    totalQuestions: 10,
    percentageScore: 80,
    bandScore: 7.5,
    timeSpentSeconds: 1085,
    tabSwitchCount: 4, // Flagged for tab switching!
  },
  {
    id: "att-rank-6",
    userId: "u-rank-6",
    userFullName: "Trần Hà My",
    userEmail: "hamy.tran@student.edu.vn",
    userStudentCode: "HV-2026-1064",
    testId: "test-placement-2026",
    testTitle: "[Placement Test 2026] - Đề Thi Xếp Lớp Đầu Vào Chuẩn IELTS & Học Thuật",
    testSkill: "READING",
    isPlacement: true,
    status: "SUBMITTED",
    startedAt: "2026-10-25T10:00:00.000Z",
    expiresAt: "2026-10-25T10:25:00.000Z",
    submittedAt: "2026-10-25T10:16:00.000Z",
    draftAnswers: {},
    flaggedQuestions: [],
    rawScore: 7,
    totalQuestions: 10,
    percentageScore: 70,
    bandScore: 7.0,
    timeSpentSeconds: 960,
    tabSwitchCount: 0,
  },
  {
    id: "att-rank-7",
    userId: "u-rank-7",
    userFullName: "Hoàng Gia Huy",
    userEmail: "giahuy.hoang@student.edu.vn",
    userStudentCode: "HV-2026-1079",
    testId: "test-placement-2026",
    testTitle: "[Placement Test 2026] - Đề Thi Xếp Lớp Đầu Vào Chuẩn IELTS & Học Thuật",
    testSkill: "READING",
    isPlacement: true,
    status: "SUBMITTED",
    startedAt: "2026-10-25T11:00:00.000Z",
    expiresAt: "2026-10-25T11:25:00.000Z",
    submittedAt: "2026-10-25T11:19:00.000Z",
    draftAnswers: {},
    flaggedQuestions: [],
    rawScore: 6,
    totalQuestions: 10,
    percentageScore: 60,
    bandScore: 6.5,
    timeSpentSeconds: 1140,
    tabSwitchCount: 0,
  },
  {
    id: "att-rank-8",
    userId: "u-rank-8",
    userFullName: "Bùi Khánh Linh",
    userEmail: "khanhlinh.bui@student.edu.vn",
    userStudentCode: "HV-2026-1088",
    testId: "test-placement-2026",
    testTitle: "[Placement Test 2026] - Đề Thi Xếp Lớp Đầu Vào Chuẩn IELTS & Học Thuật",
    testSkill: "READING",
    isPlacement: true,
    status: "SUBMITTED",
    startedAt: "2026-10-25T11:00:00.000Z",
    expiresAt: "2026-10-25T11:25:00.000Z",
    submittedAt: "2026-10-25T11:21:00.000Z",
    draftAnswers: {},
    flaggedQuestions: [],
    rawScore: 5,
    totalQuestions: 10,
    percentageScore: 50,
    bandScore: 6.0,
    timeSpentSeconds: 1260,
    tabSwitchCount: 2,
  },
  {
    id: "att-rank-9",
    userId: "u-rank-9",
    userFullName: "Đặng Quốc Khánh",
    userEmail: "quockhanh.dang@student.edu.vn",
    userStudentCode: "HV-2026-1095",
    testId: "test-placement-2026",
    testTitle: "[Placement Test 2026] - Đề Thi Xếp Lớp Đầu Vào Chuẩn IELTS & Học Thuật",
    testSkill: "READING",
    isPlacement: true,
    status: "SUBMITTED",
    startedAt: "2026-10-25T14:00:00.000Z",
    expiresAt: "2026-10-25T14:25:00.000Z",
    submittedAt: "2026-10-25T14:23:10.000Z",
    draftAnswers: {},
    flaggedQuestions: [],
    rawScore: 3,
    totalQuestions: 10,
    percentageScore: 30,
    bandScore: 5.0,
    timeSpentSeconds: 1390,
    tabSwitchCount: 6,
  },
  {
    id: "att-rank-10",
    userId: "user-student-1",
    userFullName: "Nguyễn Minh Khôi",
    userEmail: "hocvien@bluepass.edu.vn",
    userStudentCode: "HV-2026-1042",
    testId: "test-popcorn-cinema",
    testTitle: "[BluePass Collect] - How popcorn came to the cinema",
    testSkill: "READING",
    isPlacement: false,
    status: "SUBMITTED",
    startedAt: "2026-10-26T15:00:00.000Z",
    expiresAt: "2026-10-26T15:20:00.000Z",
    submittedAt: "2026-10-26T15:12:45.000Z",
    draftAnswers: {},
    flaggedQuestions: [],
    rawScore: 9,
    totalQuestions: 10,
    percentageScore: 90,
    bandScore: 8.0,
    timeSpentSeconds: 765,
    tabSwitchCount: 0,
  },
];

// ============================================================================
// UEH-STYLE ANNOUNCEMENT PORTAL SEED DATA ("THÔNG BÁO CHUNG")
// ============================================================================
export const INITIAL_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: "ann-1",
    title:
      "[CHÍNH THỨC] Công bố Danh sách Xếp lớp & Lịch học Khóa IELTS Intensive Đợt 1 Tháng 10/2026",
    slug: "cong-bo-danh-sach-xep-lop-dot-1-thang-10-2026",
    category: "PLACEMENT_RESULT",
    senderName: "Phòng Đào Tạo & Khảo Thí",
    senderDepartment: "Hội Đồng Tuyển Sinh BluePass",
    isPinned: true,
    isPublished: true,
    isNew: true,
    publishedAt: "2026-10-27T09:30:00.000Z",
    attachmentName: "Quyet_Dinh_Xep_Lop_K2026_Dot1.xlsx",
    attachmentUrl: "/api/admin/rankings?format=csv",
    contentHtml: `
      <div class="space-y-3 text-slate-700 leading-relaxed">
        <p>Căn cứ kết quả kỳ thi <strong>Thi Xếp Lớp Đầu Vào Chuẩn Quốc Tế 2026</strong> và biên bản rà soát dữ liệu chống gian lận của Ban Khảo Thí, Phòng Đào Tạo chính thức công bố danh sách phân lớp học viên đợt 1 tháng 10/2026 như sau:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li><strong>Lớp IELTS Intensive 7.5+ (C1):</strong> Dành cho học viên đạt từ 85% – 100% điểm chuẩn và không vi phạm quy chế chuyển tab.</li>
          <li><strong>Lớp IELTS Fighter 6.5 (B2+):</strong> Dành cho học viên đạt từ 70% – 84% điểm chuẩn.</li>
          <li><strong>Lớp IELTS Pre-Intermediate 5.5 (B1):</strong> Dành cho học viên đạt từ 50% – 69% điểm chuẩn.</li>
          <li><strong>Cần học bổ trợ / Thi lại:</strong> Học viên dưới 45% hoặc có số lần chuyển tab vượt mức quy định (&ge; 5 lần).</li>
        </ul>
        <p>Học viên vui lòng tra cứu Mã Học Viên (MSSV) trong bảng phân lớp bên dưới để nắm rõ phòng học và ca học chính thức.</p>
      </div>
    `,
    placementData: [
      {
        studentCode: "HV-2026-1001",
        fullName: "Phạm Ngọc Bảo Trân",
        score: "10/10 (100%)",
        band: "8.5 - 9.0",
        assignedClass: "IELTS Intensive 7.5+ (C1-01)",
        schedule: "Thứ 2 - 4 - 6 (18:30 - 20:30)",
        room: "P. B1-302 (Cơ sở Quận 1)",
        status: "ĐẠT - XẾP LỚP",
      },
      {
        studentCode: "HV-2026-1015",
        fullName: "Lê Hoàng Minh Quân",
        score: "10/10 (100%)",
        band: "8.5 - 9.0",
        assignedClass: "IELTS Intensive 7.5+ (C1-01)",
        schedule: "Thứ 2 - 4 - 6 (18:30 - 20:30)",
        room: "P. B1-302 (Cơ sở Quận 1)",
        status: "ĐẠT - XẾP LỚP",
      },
      {
        studentCode: "HV-2026-1042",
        fullName: "Nguyễn Minh Khôi",
        score: "9/10 (90%)",
        band: "8.0",
        assignedClass: "IELTS Intensive 7.5+ (C1-01)",
        schedule: "Thứ 2 - 4 - 6 (18:30 - 20:30)",
        room: "P. B1-302 (Cơ sở Quận 1)",
        status: "ĐẠT - XẾP LỚP",
      },
      {
        studentCode: "HV-2026-1028",
        fullName: "Đỗ Thùy Dương",
        score: "8/10 (80%)",
        band: "7.5",
        assignedClass: "IELTS Fighter 6.5 (B2-02)",
        schedule: "Thứ 3 - 5 - 7 (18:30 - 20:30)",
        room: "P. B1-205 (Cơ sở Quận 3)",
        status: "ĐẠT - XẾP LỚP",
      },
      {
        studentCode: "HV-2026-1064",
        fullName: "Trần Hà My",
        score: "7/10 (70%)",
        band: "7.0",
        assignedClass: "IELTS Fighter 6.5 (B2-02)",
        schedule: "Thứ 3 - 5 - 7 (18:30 - 20:30)",
        room: "P. B1-205 (Cơ sở Quận 3)",
        status: "ĐẠT - XẾP LỚP",
      },
      {
        studentCode: "HV-2026-1079",
        fullName: "Hoàng Gia Huy",
        score: "6/10 (60%)",
        band: "6.5",
        assignedClass: "IELTS Pre-Inter 5.5 (B1-04)",
        schedule: "Thứ 2 - 4 - 6 (19:30 - 21:30)",
        room: "P. A2-104 (Online Hybrid)",
        status: "ĐẠT - XẾP LỚP",
      },
      {
        studentCode: "HV-2026-1088",
        fullName: "Bùi Khánh Linh",
        score: "5/10 (50%)",
        band: "6.0",
        assignedClass: "IELTS Pre-Inter 5.5 (B1-04)",
        schedule: "Thứ 2 - 4 - 6 (19:30 - 21:30)",
        room: "P. A2-104 (Online Hybrid)",
        status: "CẦN HỌC BỔ TRỢ",
      },
      {
        studentCode: "HV-2026-1095",
        fullName: "Đặng Quốc Khánh",
        score: "3/10 (30%)",
        band: "5.0",
        assignedClass: "Chưa đủ điều kiện (Vi phạm 6 lần chuyển tab)",
        schedule: "Đăng ký thi lại ngày 02/11/2026",
        room: "Phòng Khảo Thí",
        status: "LOẠI / THI LẠI",
      },
    ],
  },
  {
    id: "ann-2",
    title:
      "Quy định về Hệ thống Giám sát Chống gian lận (Anti-Cheat & Tab-Switch) trong kỳ thi Xếp lớp trực tuyến",
    slug: "quy-dinh-he-thong-giam-sat-chong-gian-lan-thi-xep-lop",
    category: "EXAM_NOTICE",
    senderName: "Ban Khảo Thí & Đảm Bảo Chất Lượng",
    senderDepartment: "Trung Tâm Khảo Thí BluePass",
    isPinned: true,
    isPublished: true,
    isNew: true,
    publishedAt: "2026-10-24T14:15:00.000Z",
    contentHtml: `
      <div class="space-y-3 text-slate-700 leading-relaxed">
        <p>Nhằm đảm bảo tính công bằng tuyệt đối cho tất cả học viên tham gia <strong>Thi Xếp Lớp Đầu Vào</strong>, hệ thống BluePass áp dụng cơ chế bảo mật 3 lớp:</p>
        <ol class="list-decimal pl-5 space-y-1.5">
          <li><strong>Đồng hồ đếm ngược từ máy chủ (Server-Authoritative Timer):</strong> Thời gian bắt đầu và kết thúc được khóa trực tiếp trên cơ sở dữ liệu PostgreSQL. Mọi hành vi chỉnh giờ máy tính cá nhân đều không có tác dụng.</li>
          <li><strong>Tự động lưu nháp mỗi 10 giây (Crash Recovery):</strong> Nếu mất kết nối mạng hoặc nhấn F5, bài làm của học viên vẫn được khôi phục nguyên vẹn.</li>
          <li><strong>Cảnh báo chuyển cửa sổ (Tab-Switch Detection):</strong> Hệ thống tự động ghi nhận mỗi lần học viên rời khỏi màn hình làm bài. Bài thi có từ <strong>5 lần chuyển tab trở lên</strong> sẽ bị đánh dấu cảnh báo đỏ trên Bảng Xếp Hạng của Hội đồng xét duyệt.</li>
        </ol>
      </div>
    `,
  },
  {
    id: "ann-3",
    title:
      "Thông báo lịch mở cổng đăng ký Thi Xếp Lớp Đợt 2 (Khai giảng tháng 11/2026) và hướng dẫn tự đăng ký tài khoản",
    slug: "thong-bao-lich-mo-cong-thi-xep-lop-dot-2-thang-11-2026",
    category: "CLASS_SCHEDULE",
    senderName: "Phòng Công Tác Học Viên",
    senderDepartment: "Phòng Đào Tạo",
    isPinned: false,
    isPublished: true,
    isNew: false,
    publishedAt: "2026-10-20T08:00:00.000Z",
    contentHtml: `
      <div class="space-y-3 text-slate-700 leading-relaxed">
        <p>Phòng Đào Tạo thông báo mở cổng tự đăng ký tài khoản học viên và làm bài Thi Xếp Lớp Đợt 2 từ ngày <strong>28/10/2026 đến hết ngày 05/11/2026</strong>.</p>
        <p>Học viên mới có thể nhấn nút <strong>"Đăng ký học viên"</strong> trên thanh công cụ phía trên, nhận Mã Học Viên tự động và bắt đầu làm bài ngay lập tức.</p>
      </div>
    `,
  },
  {
    id: "ann-4",
    title:
      "Cập nhật bộ Sổ Từ Vựng Học Thuật (Reading Passage 1-3 & Cambridge C19-C20) tích hợp Luyện nghe Chép chính tả",
    slug: "cap-nhat-bo-so-tu-vung-hoc-thuat-cambridge-c20",
    category: "GENERAL",
    senderName: "Ban Chuyên Môn Tiếng Anh Học Thuật",
    senderDepartment: "Hội Đồng Chuyên Môn",
    isPinned: false,
    isPublished: true,
    isNew: false,
    publishedAt: "2026-10-16T10:20:00.000Z",
    contentHtml: `
      <div class="space-y-3 text-slate-700 leading-relaxed">
        <p>Hệ thống vừa cập nhật thêm các bộ thẻ từ vựng chuyên sâu trích xuất trực tiếp từ các bài đọc <em>How popcorn came to the cinema</em>, <em>The rise of short-sightedness</em>, và <em>The Power of Strangers</em>.</p>
        <p>Học viên có thể ôn luyện qua 3 chế độ: <strong>Flashcard lật 2 mặt</strong>, <strong>Trắc nghiệm 4 đáp án</strong>, và <strong>Nghe - Chép chính tả (Dictation)</strong> tại mục <strong>Sổ Từ Vựng</strong>.</p>
      </div>
    `,
  },
];

// ============================================================================
// VOCABULARY HUB ("SỔ TỪ VỰNG") DECKS & WORDS
// ============================================================================
export const INITIAL_VOCAB_DECKS: VocabDeckItem[] = [
  {
    id: "deck-popcorn-cinema",
    title: "Từ vựng Reading: How Popcorn Came to the Cinema",
    slug: "tu-vung-how-popcorn-came-to-the-cinema",
    category: "Reading Passage 1",
    level: "B2 - Upper Intermediate",
    description:
      "Trọn bộ từ vựng học thuật trích từ bài đọc lịch sử rạp chiếu phim Bắc Mỹ và thời kỳ Đại Suy Thoái.",
    linkedTestId: "test-popcorn-cinema",
    wordCount: 8,
    words: [
      {
        id: "vw-1",
        deckId: "deck-popcorn-cinema",
        word: "synonymous",
        partOfSpeech: "adj.",
        phonetics: "/sɪˈnɒn.ɪ.məs/",
        meaningVi: "đồng nghĩa với, gắn liền mật thiết với",
        definitionEn: "Having the same meaning or closely associated with something in people's minds.",
        exampleEn: "Today, the scent of buttered popcorn is almost synonymous with the cinema experience.",
        exampleVi: "Ngày nay, hương thơm của bắp rang bơ gần như gắn liền với trải nghiệm rạp chiếu phim.",
        synonyms: ["equivalent", "interchangeable", "associated"],
      },
      {
        id: "vw-2",
        deckId: "deck-popcorn-cinema",
        word: "emulate",
        partOfSpeech: "v.",
        phonetics: "/ˈem.jə.leɪt/",
        meaningVi: "mô phỏng, bắt chước để sánh ngang",
        definitionEn: "To match or surpass a person or achievement, typically by imitation.",
        exampleEn: "Theatre owners wanted to emulate high-class legitimate opera houses.",
        exampleVi: "Các chủ rạp muốn mô phỏng những nhà hát opera thượng lưu đích thực.",
        synonyms: ["imitate", "mirror", "follow"],
      },
      {
        id: "vw-3",
        deckId: "deck-popcorn-cinema",
        word: "literate",
        partOfSpeech: "adj.",
        phonetics: "/ˈlɪt.ər.ət/",
        meaningVi: "biết chữ, có khả năng đọc viết",
        definitionEn: "Able to read and write.",
        exampleEn: "Early cinema attendance was restricted primarily to literate and affluent patrons.",
        exampleVi: "Khán giả xem phim thời kỳ đầu chủ yếu giới hạn ở những người biết chữ và khá giả.",
        synonyms: ["educated", "lettered", "well-read"],
      },
      {
        id: "vw-4",
        deckId: "deck-popcorn-cinema",
        word: "affluent",
        partOfSpeech: "adj.",
        phonetics: "/ˈæf.lu.ənt/",
        meaningVi: "giàu có, thịnh vượng, sung túc",
        definitionEn: "Having a great deal of money; wealthy.",
        exampleEn: "Only affluent patrons could afford expensive silent movie palace tickets.",
        exampleVi: "Chỉ những khách hàng giàu có mới đủ khả năng mua vé đắt đỏ ở các cung điện phim câm.",
        synonyms: ["wealthy", "prosperous", "well-off"],
      },
      {
        id: "vw-5",
        deckId: "deck-popcorn-cinema",
        word: "lucrative",
        partOfSpeech: "adj.",
        phonetics: "/ˈluː.krə.tɪv/",
        meaningVi: "sinh lời cao, béo bở",
        definitionEn: "Producing a great deal of profit.",
        exampleEn: "Street vendors realised that crowds exiting theatres represented a lucrative market.",
        exampleVi: "Những người bán hàng rong nhận ra đám đông rời rạp chiếu là một thị trường sinh lời cao.",
        synonyms: ["profitable", "rewarding", "high-income"],
      },
      {
        id: "vw-6",
        deckId: "deck-popcorn-cinema",
        word: "plummet",
        partOfSpeech: "v.",
        phonetics: "/ˈplʌm.ɪt/",
        meaningVi: "lao dốc, sụt giảm mạnh và đột ngột",
        definitionEn: "To fall or drop straight down at high speed; decrease rapidly in value.",
        exampleEn: "As ticket sales plummeted during the Great Depression, luxury theatres faced bankruptcy.",
        exampleVi: "Khi doanh số bán vé lao dốc trong Đại Suy Thoái, các rạp hạng sang đối mặt nguy cơ phá sản.",
        synonyms: ["plunge", "nosedive", "collapse"],
      },
      {
        id: "vw-7",
        deckId: "deck-popcorn-cinema",
        word: "proprietor",
        partOfSpeech: "n.",
        phonetics: "/prəˈpraɪ.ə.tər/",
        meaningVi: "chủ sở hữu (cơ sở kinh doanh, rạp hát)",
        definitionEn: "The owner of a business, or a holder of property.",
        exampleEn: "Theatre proprietors inside were losing money while snack sellers outside thrived.",
        exampleVi: "Các chủ rạp bên trong đang thua lỗ trong khi người bán đồ ăn vặt bên ngoài lại ăn nên làm ra.",
        synonyms: ["owner", "landlord", "entrepreneur"],
      },
      {
        id: "vw-8",
        deckId: "deck-popcorn-cinema",
        word: "concession",
        partOfSpeech: "n.",
        phonetics: "/kənˈseʃ.ən/",
        meaningVi: "quầy nhượng quyền bán đồ ăn/thức uống trong rạp",
        definitionEn: "The right to use land or commercial premises for a specific business, such as a snack stand.",
        exampleEn: "Julia Braden operated a chain of popcorn concessions generating over $14,000 annually.",
        exampleVi: "Julia Braden vận hành chuỗi quầy bắp rang nhượng quyền mang lại hơn 14.000 đô la mỗi năm.",
        synonyms: ["stall", "franchise", "kiosk"],
      },
    ],
  },
  {
    id: "deck-myopia-science",
    title: "Từ vựng Y Sinh & Thị Giác: The Rise of Short-Sightedness",
    slug: "tu-vung-the-rise-of-short-sightedness",
    category: "Reading Passage 2",
    level: "C1 - Advanced",
    description:
      "Từ vựng chuyên ngành dịch tễ học, nhãn khoa và nghiên cứu lâm sàng thường gặp trong IELTS Reading Passage 2 & 3.",
    linkedTestId: "test-short-sightedness",
    wordCount: 6,
    words: [
      {
        id: "vw-9",
        deckId: "deck-myopia-science",
        word: "prevalence",
        partOfSpeech: "n.",
        phonetics: "/ˈprev.əl.əns/",
        meaningVi: "mức độ phổ biến, tỷ lệ lưu hành (bệnh/hiện tượng)",
        definitionEn: "The fact or condition of being widespread in a particular area at a particular time.",
        exampleEn: "Over the past half-century, the prevalence of myopia has surged at an alarming rate.",
        exampleVi: "Trong nửa thế kỷ qua, tỷ lệ lưu hành tật cận thị đã tăng vọt ở mức báo động.",
        synonyms: ["frequency", "ubiquity", "commonness"],
      },
      {
        id: "vw-10",
        deckId: "deck-myopia-science",
        word: "epidemic",
        partOfSpeech: "n.",
        phonetics: "/ˌep.ɪˈdem.ɪk/",
        meaningVi: "dịch bệnh, sự bùng phát diện rộng",
        definitionEn: "A widespread occurrence of an infectious or undesirable condition in a community.",
        exampleEn: "Ophthalmologists assumed this myopia epidemic was primarily driven by genetics.",
        exampleVi: "Các bác sĩ nhãn khoa từng cho rằng sự bùng phát cận thị này chủ yếu do di truyền.",
        synonyms: ["outbreak", "surge", "wave"],
      },
      {
        id: "vw-11",
        deckId: "deck-myopia-science",
        word: "mutate",
        partOfSpeech: "v.",
        phonetics: "/mjuːˈteɪt/",
        meaningVi: "đột biến, biến đổi gen",
        definitionEn: "To change in form or nature, especially genetically.",
        exampleEn: "Gene pools cannot mutate across an entire population in just two generations.",
        exampleVi: "Vốn gen không thể đột biến trên toàn bộ quần thể chỉ trong hai thế hệ.",
        synonyms: ["alter", "transform", "modify"],
      },
      {
        id: "vw-12",
        deckId: "deck-myopia-science",
        word: "elongate",
        partOfSpeech: "v.",
        phonetics: "/ˈiː.lɒŋ.ɡeɪt/",
        meaningVi: "kéo dài ra, giãn dài ra",
        definitionEn: "To make or become longer in relative to width.",
        exampleEn: "Dopamine prevents the eyeball from elongating excessively during childhood growth.",
        exampleVi: "Dopamine ngăn nhãn cầu giãn dài quá mức trong quá trình phát triển thời thơ ấu.",
        synonyms: ["lengthen", "stretch", "extend"],
      },
      {
        id: "vw-13",
        deckId: "deck-myopia-science",
        word: "vigorous",
        partOfSpeech: "adj.",
        phonetics: "/ˈvɪɡ.ər.əs/",
        meaningVi: "mạnh mẽ, tốn nhiều thể lực, sôi nổi",
        definitionEn: "Characterized by or involving physical strength, effort, or energy.",
        exampleEn: "The protective effect of daylight does not require vigorous physical sport.",
        exampleVi: "Tác dụng bảo vệ của ánh sáng ban ngày không đòi hỏi hoạt động thể thao tốn sức.",
        synonyms: ["strenuous", "energetic", "intense"],
      },
      {
        id: "vw-14",
        deckId: "deck-myopia-science",
        word: "intervention",
        partOfSpeech: "n.",
        phonetics: "/ˌɪn.təˈven.ʃən/",
        meaningVi: "biện pháp can thiệp (y tế / giáo dục)",
        definitionEn: "Action taken to improve a medical disorder or social situation.",
        exampleEn: "Alongside lifestyle interventions, optical engineers developed specialized contact lenses.",
        exampleVi: "Bên cạnh các biện pháp can thiệp lối sống, các kỹ sư quang học đã phát triển kính áp tròng chuyên dụng.",
        synonyms: ["treatment", "measure", "involvement"],
      },
    ],
  },
  {
    id: "deck-placement-core",
    title: "Từ vựng Trọng Tâm Thi Xếp Lớp & Môi Trường Đô Thị",
    slug: "tu-vung-trong-tam-thi-xep-lop-urban-forests",
    category: "Placement Test Core",
    level: "B1 - C1",
    description:
      "Bộ từ vựng cốt lõi giúp đạt điểm tối đa trong đề Thi Xếp Lớp Đầu Vào 2026 (The Rise of the Urban Tiny Forest).",
    linkedTestId: "test-placement-2026",
    wordCount: 5,
    words: [
      {
        id: "vw-15",
        deckId: "deck-placement-core",
        word: "sapling",
        partOfSpeech: "n.",
        phonetics: "/ˈsæp.lɪŋ/",
        meaningVi: "cây non mới trồng",
        definitionEn: "A young tree, especially one with a slender trunk.",
        exampleEn: "The Miyawaki method involves planting native saplings densely together.",
        exampleVi: "Phương pháp Miyawaki bao gồm việc trồng dày đặc các cây non bản địa gần nhau.",
        synonyms: ["seedling", "shoot", "young tree"],
      },
      {
        id: "vw-16",
        deckId: "deck-placement-core",
        word: "canopy",
        partOfSpeech: "n.",
        phonetics: "/ˈkæn.ə.pi/",
        meaningVi: "tán rừng, vòm lá che phủ",
        definitionEn: "The uppermost branches of the trees in a forest, forming a more or less continuous layer of foliage.",
        exampleEn: "Maintenance expenses drop to almost zero once the forest canopy closes.",
        exampleVi: "Chi phí bảo trì giảm xuống gần bằng không một khi tán rừng khép kín.",
        synonyms: ["foliage roof", "treetops", "overstory"],
      },
      {
        id: "vw-17",
        deckId: "deck-placement-core",
        word: "pollinator",
        partOfSpeech: "n.",
        phonetics: "/ˈpɒl.ə.neɪ.tər/",
        meaningVi: "sinh vật thụ phấn (ong, bướm, chim)",
        definitionEn: "An insect or animal that carries pollen from one plant or part of a plant to another.",
        exampleEn: "Urban mini-forests supported over 500 species, including rare pollinators.",
        exampleVi: "Các khu rừng nhỏ đô thị hỗ trợ hơn 500 loài, bao gồm các loài thụ phấn quý hiếm.",
        synonyms: ["fertilizer insect", "honeybee"],
      },
      {
        id: "vw-18",
        deckId: "deck-placement-core",
        word: "solitude",
        partOfSpeech: "n.",
        phonetics: "/ˈsɒl.ɪ.tjuːd/",
        meaningVi: "sự tĩnh lặng một mình, trạng thái biệt lập",
        definitionEn: "The state or situation of being alone.",
        exampleEn: "One group of passengers was instructed to sit in solitude during the train ride.",
        exampleVi: "Một nhóm hành khách được hướng dẫn ngồi yên lặng một mình suốt chuyến tàu.",
        synonyms: ["isolation", "seclusion", "privacy"],
      },
      {
        id: "vw-19",
        deckId: "deck-placement-core",
        word: "commute",
        partOfSpeech: "n.",
        phonetics: "/kəˈmjuːt/",
        meaningVi: "hành trình đi làm / đi học hàng ngày",
        definitionEn: "A regular journey of some distance between one's home and place of work.",
        exampleEn: "Passengers who chatted with strangers reported a significantly more pleasant commute.",
        exampleVi: "Những hành khách trò chuyện với người lạ cho biết hành trình đi làm dễ chịu hơn hẳn.",
        synonyms: ["daily journey", "transit", "travel"],
      },
    ],
  },
];

// ============================================================================
// HYBRID AI-TO-STAFF CHAT SEED THREADS
// ============================================================================
export const INITIAL_CHAT_THREADS: ChatThreadItem[] = [
  {
    id: "thread-student-1",
    userId: "user-student-1",
    studentName: "Nguyễn Minh Khôi",
    studentEmail: "hocvien@bluepass.edu.vn",
    studentCode: "HV-2026-1042",
    status: "AI_ACTIVE",
    subject: "Tư vấn lộ trình IELTS 7.5+ & Thi xếp lớp",
    unreadByStaff: false,
    unreadByStudent: false,
    updatedAt: "2026-10-27T19:45:00.000Z",
    messages: [
      {
        id: "msg-1",
        threadId: "thread-student-1",
        senderRole: "AI",
        senderName: "Trợ lý AI BluePass",
        content:
          "Xin chào Minh Khôi! Mình là Trợ lý AI của Hệ thống Luyện đề & Khảo thí BluePass. Bạn cần tư vấn về **Lịch khai giảng & Học phí**, **Quy chế Thi Xếp Lớp**, hay **Hướng dẫn luyện đề Reading/Listening**? Nếu cần hỗ trợ chuyên sâu, bạn có thể nhấn nút **Gặp nhân viên tư vấn** bất cứ lúc nào nhé!",
        createdAt: "2026-10-27T19:44:00.000Z",
      },
    ],
  },
  {
    id: "thread-needs-human-1",
    userId: "u-rank-4",
    studentName: "Đỗ Thùy Dương",
    studentEmail: "thuyduong.do@student.edu.vn",
    studentCode: "HV-2026-1028",
    status: "NEEDS_HUMAN",
    subject: "Xin đổi lịch học lớp IELTS Fighter 6.5 (B2-02)",
    unreadByStaff: true,
    unreadByStudent: false,
    updatedAt: "2026-10-27T20:10:00.000Z",
    messages: [
      {
        id: "msg-nh-1",
        threadId: "thread-needs-human-1",
        senderRole: "STUDENT",
        senderName: "Đỗ Thùy Dương",
        content:
          "Chào trung tâm, em vừa xem thông báo xếp lớp đạt 8/10 được xếp vào lớp B2-02 tối Thứ 3-5-7, nhưng tối Thứ 5 em vướng lịch học ở trường ĐH Kinh Tế (UEH). Em muốn xin chuyển sang ca Thứ 2-4-6 được không ạ?",
        createdAt: "2026-10-27T20:09:30.000Z",
      },
      {
        id: "msg-nh-2",
        threadId: "thread-needs-human-1",
        senderRole: "AI",
        senderName: "Trợ lý AI BluePass",
        content:
          "Hệ thống đã ghi nhận yêu cầu đổi ca học cá nhân của bạn Đỗ Thùy Dương (Mã HV: HV-2026-1028). Vì việc điều chuyển danh sách lớp chính thức cần xác nhận từ **Phòng Đào Tạo**, mình đã chuyển cuộc trò chuyện sang trạng thái **Cần Nhân Viên Tư Vấn (NEEDS_HUMAN)**. Tư vấn viên sẽ phản hồi bạn ngay tại khung chat này!",
        createdAt: "2026-10-27T20:10:00.000Z",
      },
    ],
  },
];
