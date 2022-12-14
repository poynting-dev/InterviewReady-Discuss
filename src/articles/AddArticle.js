import { addDoc, collection, Timestamp } from 'firebase/firestore'
import React, { useState } from 'react'
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { db, storage } from '../firebase'
import { toast } from 'react-toastify'

export default function AddArticle() {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        image: '',
        createdAt: Timestamp.now().toDate(),
    })

    const [progress, setProgress] = useState(0)

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleImageChange = (e) => {
        setFormData({ ...formData, image: e.target.files[0] })
    }

    const handlePublish = () => {
        if (!formData.title || !formData.description || !formData.image) {
            alert('Please fill all the fields')
            return
        }

        const storageRef = ref(
            storage,
            `/images/${Date.now()}${formData.image.name}`
        )

        const uploadImage = uploadBytesResumable(storageRef, formData.image)
        uploadImage.on(
            'state_changed',
            (snapshot) => {
                const progressPercent = Math.round(
                    (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                )
                setProgress(progressPercent)
            },
            (err) => {
                console.log(err)
            },
            () => {
                setFormData({
                    title: '',
                    description: '',
                    image: '',
                })

                getDownloadURL(uploadImage.snapshot.ref).then((url) => {
                    const articleRef = collection(db, 'article')
                    addDoc(articleRef, {
                        title: formData.title,
                        description: formData.description,
                        imageUrl: url,
                        createdAt: Timestamp.now().toDate(),
                    })
                        .then(() => {
                            toast('Article added successfully', {
                                type: 'success',
                            })
                            setProgress(0)
                        })
                        .catch((err) => {
                            toast('Error adding article', { type: 'error' })
                        })
                })
            }
        )
    }

    return (
        <div
            className="border p-3 mt-3 bg-light"
            // style={{ position: 'fixed' }}
        >
            <h2>Create Article</h2>
            <label htmlFor="">Title</label>
            <input
                type="text"
                name="title"
                value={formData.title}
                className="form-control"
                onChange={(e) => handleChange(e)}
            />

            {/* description */}
            <label htmlFor="">Description</label>
            <textarea
                type="text"
                name="description"
                value={formData.description}
                className="form-control"
                onChange={(e) => handleChange(e)}
            />

            {/* image */}
            <label htmlFor="">Image</label>
            <input
                type="file"
                name="image"
                accept="image/*"
                className="form-control"
                onChange={(e) => handleImageChange(e)}
            />
            {progress === 0 ? null : (
                <div className="progess">
                    <div
                        className="progress-bar progress-bar-striped progress-bar-animated"
                        role="progressbar"
                        style={{ width: `${progress}%` }}
                    >
                        {`uploading image ${progress}%`}
                    </div>
                </div>
            )}

            <button
                className="form-control btn-primary mt-2"
                onClick={handlePublish}
            >
                Publish
            </button>
        </div>
    )
}
