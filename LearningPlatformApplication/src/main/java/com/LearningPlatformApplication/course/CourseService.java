package com.LearningPlatformApplication.course;

import com.LearningPlatformApplication.course.dto.ChapterDTO;
import com.LearningPlatformApplication.course.dto.CourseResponse;
import com.LearningPlatformApplication.course.dto.CreateCourseRequest;
import com.LearningPlatformApplication.course.dto.LessonDTO;
import com.LearningPlatformApplication.course.dto.UpdateCourseRequest;
import com.LearningPlatformApplication.lesson.Lesson;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final CourseMapper courseMapper;

    public List<CourseResponse> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(courseMapper::toResponse)
                .collect(Collectors.toList());
    }

    public CourseResponse getCourseById(UUID id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        return courseMapper.toResponse(course);
    }

    public CourseResponse createCourse(CreateCourseRequest request) {
        UUID courseId = UUID.randomUUID();
        List<Chapter> chapterEntities = new ArrayList<>();

        if (request.getChapters() != null) {
            int chapSeq = 1;
            for (ChapterDTO cDto : request.getChapters()) {
                UUID chapterId = UUID.randomUUID();
                List<Lesson> lessonEntities = new ArrayList<>();

                if (cDto.getLessons() != null) {
                    int lesSeq = 1;
                    for (LessonDTO lDto : cDto.getLessons()) {
                        Lesson lesson = Lesson.builder()
                                .id(UUID.randomUUID())
                                .courseId(courseId)
                                .chapterId(chapterId)
                                .title(lDto.getTitle() != null ? lDto.getTitle() : "Lesson " + lesSeq)
                                .description(lDto.getDescription())
                                .lessonType(lDto.getLessonType() != null ? lDto.getLessonType() : "VIDEO")
                                .contentUrl(lDto.getContentUrl())
                                .videoThumbnailUrl(lDto.getVideoThumbnailUrl())
                                .quizData(lDto.getQuizData())
                                .sequenceOrder(lDto.getSequenceOrder() != null ? lDto.getSequenceOrder() : lesSeq++)
                                .build();
                        lessonEntities.add(lesson);
                    }
                }

                Chapter chapter = Chapter.builder()
                        .id(chapterId)
                        .courseId(courseId)
                        .title(cDto.getTitle() != null ? cDto.getTitle() : "Chapter " + chapSeq)
                        .sequenceOrder(cDto.getSequenceOrder() != null ? cDto.getSequenceOrder() : chapSeq++)
                        .lessons(lessonEntities)
                        .build();

                chapterEntities.add(chapter);
            }
        }

        Course course = Course.builder()
                .id(courseId)
                .title(request.getTitle())
                .description(request.getDescription())
                .instructorId(request.getInstructorId())
                .price(request.getPrice())
                .status("PUBLISHED")
                .chapters(chapterEntities)
                .build();

        return courseMapper.toResponse(courseRepository.save(course));
    }

    public CourseResponse updateCourse(UUID id, UpdateCourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        if (request.getTitle() != null) course.setTitle(request.getTitle());
        if (request.getDescription() != null) course.setDescription(request.getDescription());
        if (request.getPrice() != null) course.setPrice(request.getPrice());
        if (request.getStatus() != null) course.setStatus(request.getStatus());
        return courseMapper.toResponse(courseRepository.save(course));
    }
}
