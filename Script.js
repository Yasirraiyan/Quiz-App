let token = "";
        let questions = [
            { question: "What is 2 + 2?", options: ["3", "4", "5", "6"], answer: "4" },
            { question: "What is the capital of France?", options: ["Rome", "Paris", "Madrid", "Berlin"], answer: "Paris" }
        ];
        let comments = [];

        function showPage(pageId) {
            document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
            document.getElementById(pageId).classList.add("active");
        }

        async function register() {
            const username = document.getElementById("register-username").value;
            const password = document.getElementById("register-password").value;
            localStorage.setItem(username, password);
            alert("Registered Successfully!");
            showPage("login-page");
        }

        async function login() {
            const username = document.getElementById("login-username").value;
            const password = document.getElementById("login-password").value;
            if (localStorage.getItem(username) === password) {
                token = "user-authenticated";
                alert("Login Successful!");
                showPage("question-page");
                loadQuiz();
            } else {
                alert("Invalid Credentials!");
            }
        }

        async function loginWithGoogle() {
            alert("Logged in with Google!");
            token = "google-authenticated";
            showPage("question-page");
            loadQuiz();
        }

        async function loginWithFacebook() {
            alert("Logged in with Facebook!");
            token = "facebook-authenticated";
            showPage("question-page");
            loadQuiz();
        }

        function loadQuiz() {
            let quizContainer = document.getElementById("quiz-container");
            quizContainer.innerHTML = "";
            questions.forEach((q, index) => {
                let div = document.createElement("div");
                div.innerHTML = `<h3>${q.question}</h3>`;
                q.options.forEach(option => {
                    div.innerHTML += `<input type="radio" name="q${index}" value="${option}"> ${option} <br>`;
                });
                quizContainer.appendChild(div);
            });
        }

        function submitQuiz() {
            let score = 0;
            questions.forEach((q, index) => {
                let selectedOption = document.querySelector(`input[name="q${index}"]:checked`);
                if (selectedOption && selectedOption.value === q.answer) {
                    score++;
                }
            });
            const scoreElement = document.getElementById("score");
            scoreElement.innerText = `Your Score: ${score} / ${questions.length}`;

            if (score >= questions.length / 2) {
                scoreElement.classList.add("passed");
                scoreElement.classList.remove("failed");
                scoreElement.innerText += "\nYou Passed!";
            } else {
                scoreElement.classList.add("failed");
                scoreElement.classList.remove("passed");
                scoreElement.innerText += "\nYou Failed!";
            }

            showPage("result-page");
        }

        // Handle multi-level comments
        function submitComment() {
            const commentInput = document.getElementById("comment-input");
            const comment = commentInput.value;
            if (comment) {
                comments.push({ text: comment, replies: [] });
                commentInput.value = "";
                displayComments();
            }
        }

        function displayComments() {
            const commentsList = document.getElementById("comments-list");
            commentsList.innerHTML = "";
            comments.forEach((comment, index) => {
                const commentDiv = document.createElement("div");
                commentDiv.innerHTML = `<p>${comment.text}</p>`;
                const replyBox = document.createElement("div");
                replyBox.classList.add("comment-reply");
                const replyInput = document.createElement("textarea");
                replyInput.placeholder = "Reply to this comment...";
                replyBox.appendChild(replyInput);
                const replyButton = document.createElement("button");
                replyButton.innerText = "Reply";
                replyButton.onclick = () => replyToComment(index, replyInput.value);
                replyBox.appendChild(replyButton);
                commentDiv.appendChild(replyBox);
                commentsList.appendChild(commentDiv);
            });
        }

        function replyToComment(commentIndex, replyText) {
            if (replyText) {
                comments[commentIndex].replies.push(replyText);
                displayComments();
            }
        }

        // Report generation
        function generateReport() {
            const reportResult = document.getElementById("report-result");
            let reportContent = "<h4>Quiz Report:</h4>";
            let totalScore = 0;
            let passingScore = questions.length / 2;

            questions.forEach((q, index) => {
                const selectedOption = document.querySelector(`input[name="q${index}"]:checked`);
                const correctAnswer = selectedOption && selectedOption.value === q.answer ? "Correct" : "Incorrect";
                reportContent += `<p>Q${index + 1}: ${q.question}<br>Answer: ${correctAnswer}</p>`;
                if (correctAnswer === "Correct") totalScore++;
            });

            const scoreResult = totalScore >= passingScore ? "Passed" : "Failed";
            reportContent += `<p>Total Score: ${totalScore} / ${questions.length} (${scoreResult})</p>`;
            reportResult.innerHTML = reportContent;
        }
    </script>
