package com.glydecurtains.repository;

import com.glydecurtains.entity.StaticPage;
import com.glydecurtains.entity.enums.PageType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaticPageRepository extends JpaRepository<StaticPage, Long> {

    Optional<StaticPage> findBySlug(String slug);

    Optional<StaticPage> findBySlugAndIsVisibleTrue(String slug);

    List<StaticPage> findByIsVisibleTrue();

    List<StaticPage> findByPageType(PageType pageType);

    boolean existsBySlug(String slug);
}
