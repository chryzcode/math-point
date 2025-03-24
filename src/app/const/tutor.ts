
export class Tutor {
    constructor(
      public name: string,
      public experience: string,
      public grades: string,
      public bio: string,
      public quote: string,
      public imagePath: string
    ) {}
  }
  export const tutors = [
    new Tutor(
      "Robina Sarwar",
      "6 years",
      "Pre-K–12",
      "Robina, math tutor with 6 years of teaching experience:",
      "“I believe that kids should be taught with patience and consideration. My job is to ensure that your kids learn effectively in an enjoyable way.”",
      "/my.png" // Replace with actual image path
    ),
    new Tutor(
      "Muhammad Ramzan",
      "8 years",
      "Pre-K-University",
      "Muhammad, math tutor with 8 years of teaching experience:",
      "“Unlock the power of numbers with personalized math tutoring! Whether you're solving for “X” or mastering calculus, I make math easy to understand and fun to learn.”",
      "/Muhammad.jpeg" // Replace with actual image path
    )
  ];

